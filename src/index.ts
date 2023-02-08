export type Call<T extends readonly any[], U> = {
    resolve: (u: U | PromiseLike<U>) => void
    reject: (e: any) => void
    args: T
}

export type CallOf<T extends (...args: readonly any[]) => Promise<any>> =
    T extends (...args: infer Args) => Promise<infer Result>
        ? Call<Args, Result>
        : never

export const constant = <T>(t: T) => ({ resolve }: Call<any[], T>) => resolve(t)
export const thrower = (e: any) => ({ reject }: Call<any[], never>) => reject(e)
export const wrap = <T extends readonly any[], U>(
    f: (...args: T) => U | Promise<U>
) => (
    { resolve, reject, args }: Call<T, U>
) => {
    try {
        const ret = f(...args)
        if (ret && typeof ret == 'object' && ret instanceof Promise)
            ret.then(resolve, reject)
        else resolve(ret)
    } catch(e) { reject(e) }
}

export function bufferedDispatch<T extends readonly any[], U>(): [
    (...args: T) => Promise<U>,
    () => Promise<Call<T, U>>
] {
    const callq: Call<T, U>[] = []
    const handlerq: ((c: Call<T, U>) => void)[] = []
    return [
        (...args: T) => new Promise((resolve, reject) => {
            const call = { resolve, reject, args }
            const handler = handlerq.shift()
            if (handler) handler(call)
            else callq.push(call)
        }),
        () => {
            const item = callq.shift()
            if (item) return Promise.resolve(item)
            return new Promise(res => handlerq.push(res))
        }
    ]
}