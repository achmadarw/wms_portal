import NProgress from 'nprogress';

/**
 * Utility to wrap async functions with NProgress loading indicator
 * @param asyncFn - The async function to execute
 * @returns The result of the async function
 */
export async function withProgress<T>(asyncFn: () => Promise<T>): Promise<T> {
    NProgress.start();
    try {
        const result = await asyncFn();
        return result;
    } finally {
        NProgress.done();
    }
}

/**
 * Hook to manually control NProgress
 */
export const progress = {
    start: () => NProgress.start(),
    done: () => NProgress.done(),
    inc: () => NProgress.inc(),
    set: (n: number) => NProgress.set(n),
};
