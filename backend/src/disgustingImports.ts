// beurk file

type KeyExtendsFunc<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

const fileType_DynamicImport = import("file-type")

const dynamicImportGenerator = <
    V extends Promise<object>,
    U extends KeyExtendsFunc<Awaited<V>>,
    T extends (...args: any[]) => any = Awaited<V>[U]
>(v: V, prop: U) => async (...args: Parameters<T>): Promise<ReturnType<Awaited<V>[U]>> => ((await v)[prop] as T)(...args)

export const fileTypeFromBuffer = dynamicImportGenerator(fileType_DynamicImport, "fileTypeFromBuffer")
