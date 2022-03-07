import { CallOf, bufferedDispatch } from "../src"

const shortWhile = () => new Promise(res => setTimeout(res, 10))

describe('Buffered dispatch', () => {
    var request: (s: string) => Promise<string>
    var serve: () => Promise<CallOf<typeof request>>

    beforeEach(() => [request, serve] = bufferedDispatch())

    test('Calls are queued until after a server pops up', async () => {
        const result = request('foo')
        await shortWhile()
        const { resolve, args: [arg] } = await serve()
        expect(arg).toBe('foo')
        resolve('bar')
        expect(result).resolves.toBe('bar')
    })
    
    test('Rejections are transferred', async () => {
        const result = request('')
        const { reject } = await serve()
        reject('bar')
        expect(result).rejects.toBe('bar')
    })

    test('Servers are queued until a call pops up', async () => {
        const call = serve()
        await shortWhile()
        const result = request('foo')
        call.then(({ resolve, args: [arg] }) => {
            expect(arg).toBe('foo')
            resolve('bar')
        })
        expect(result).resolves.toBe('bar')
    })

    test('Multiple requests are queued', async () => {
        const [p1, p2, p3] = [request('req1'), request('req2'), request('req3')]
        await shortWhile()
        // Simple example of a server loop
        ;(async () => {
            while (true) {
                const { resolve, args: [ arg ]} = await serve()
                resolve(`res${arg.slice(3)}`)
            }
        })();
        const [val1, val2, val3] = await Promise.all([p1, p2, p3])
        expect([val1, val2, val3]).toStrictEqual(['res1', 'res2', 'res3'])
    })

    test('Multiple servers are queued', async () => {
        const [p1, p2, p3] = [serve(), serve(), serve()]
        await shortWhile()
        request('req1')
        request('req2')
        request('req3')
        const [call1, call2, call3] = await Promise.all([p1, p2, p3])
        const [arg1, arg2, arg3] = [call1.args[0], call2.args[0], call3.args[0]]
        expect([arg1, arg2, arg3]).toStrictEqual(['req1', 'req2', 'req3'])
    })
})