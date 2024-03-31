import { log } from '@clack/prompts'

export const logSuccess = (msg: string) => {
    log.success(msg)
}

export const logError = (msg: string) => {
    log.error(msg)
}

export const logMsg = (msg: string) => {
    log.message(msg)
}

export const andMap = (field: string, arr1: any[], arr2: any[], fn: (a: any, b: any) => boolean) => {
    if (arr1.length !== arr2.length) {
        logError(`not the same length: (parsed major) ${arr1.length} !== (prod major) ${arr2.length}`)
        return false
    }

    for (let i = 0; i < arr1.length; i++) {
        if (!fn(arr1[i], arr2[i])) {
            // logMsg(`error at index ${i}`)
            return false
        }
    }

    return true;
}

export const compare = (field: string, a1: any, a2: any, fn: (x: any, b: any) => boolean) : boolean => {
    return fn(a1, a2)
}