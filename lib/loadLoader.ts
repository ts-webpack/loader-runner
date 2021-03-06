import { LoaderObject } from './LoaderRunner'

export = function loadLoader(loader: LoaderObject, callback: (err?: Error) => any) {
    if (typeof System === 'object' && typeof System.import === 'function') {
        System.import(loader.path)
            .catch(callback)
            .then(module => {
                loader.normal = module.default;
                loader.pitch = module.pitch;
                loader.raw = module.raw;
                if (typeof loader.normal !== 'function' && typeof loader.pitch !== 'function') {
                    throw new Error(`Module '${loader.path}' is not a loader (must have normal or pitch function)`);
                }
                callback();
            });
    }
    else {
        let module
        try {
            module = require(loader.path);
        } catch (e) {
            // it is possible for node to choke on a require if the FD descriptor
            // limit has been reached. give it a chance to recover.
            if (e instanceof Error && (<NodeJS.ErrnoException>e).code === 'EMFILE') {
                const retry = loadLoader.bind(null, loader, callback);
                if (typeof setImmediate === 'function') {
                    // node >= 0.9.0
                    return setImmediate(retry);
                }
                else {
                    // node < 0.9.0
                    return process.nextTick(retry);
                }
            }
            return callback(e);
        }
        // todo: as loader is not ab object, how can it has path?
        if (typeof loader !== 'function' && typeof loader !== 'object') {
            throw new Error(`Module '${loader.path}' is not a loader (export function or es6 module))`);
        }
        loader.normal = typeof module === 'function' ? module : module.default;
        loader.pitch = module.pitch;
        loader.raw = module.raw;
        if (typeof loader.normal !== 'function' && typeof loader.pitch !== 'function') {
            throw new Error(`Module '${loader.path}' is not a loader (must have normal or pitch function)`);
        }
        callback();
    }
};
