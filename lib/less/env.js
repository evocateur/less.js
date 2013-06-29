(function (tree) {

    var parseCopyProperties = [
        'paths',            // option - unmodified - paths to search for imports on
        'optimization',     // option - optimization level (for the chunker)
        'files',            // list of files that have been imported, used for import-once
        'contents',         // browser-only, contents of all the files
        'relativeUrls',     // option - whether to adjust URL's to be relative
        'strictImports',    // option -
        'dumpLineNumbers',  // option - whether to dump line numbers
        'compress',         // option - whether to compress
        'processImports',   // option - whether to process imports. if false then imports will not be imported
        'syncImport',       // option - whether to import synchronously
        'mime',             // browser only - mime type for sheet import
        'currentFileInfo'   // information about the current file - for error reporting and importing and making urls relative etc.
    ];

    //currentFileInfo = {
    //  'relativeUrls' - option - whether to adjust URL's to be relative
    //  'filename' - full resolved filename of current file
    //  'rootpath' - path to append to normal URLs for this node
    //  'currentDirectory' - path to the current file, absolute
    //  'rootFilename' - filename of the base file
    //  'entryPath' = absolute path to the entry file

    tree.parseEnv = function(options) {
        copyFromOriginal(options, this, parseCopyProperties);

        if (!this.contents) { this.contents = {}; }
        if (!this.files) { this.files = {}; }

        if (!this.currentFileInfo) {
            var filename = (options && options.filename) || "input";
            var entryPath = filename.replace(/[^\/\\]*$/, "");
            if (options) {
                options.filename = null;
            }
            this.currentFileInfo = {
                filename: filename,
                relativeUrls: this.relativeUrls,
                rootpath: (options && options.rootpath) || "",
                currentDirectory: entryPath,
                entryPath: entryPath,
                rootFilename: filename
            };
        }
    };

    tree.parseEnv.prototype.toSheet = function (path) {
        var env = new tree.parseEnv(this);
        env.href = path;
        //env.title = path;
        env.type = this.mime;
        return env;
    };

    tree.parseEnv.prototype.normalizePath = normalizePath;

    var evalCopyProperties = [
        'silent',      // whether to swallow errors and warnings
        'verbose',     // whether to log more activity
        'compress',    // whether to compress
        'yuicompress', // whether to compress with the outside tool yui compressor
        'ieCompat',    // whether to enforce IE compatibility (IE8 data-uri)
        'strictMath',  // whether math has to be within parenthesis
        'strictUnits'  // whether units need to evaluate correctly
        ];

    tree.evalEnv = function(options, frames) {
        copyFromOriginal(options, this, evalCopyProperties);

        this.frames = frames || [];
    };

    tree.evalEnv.prototype.inParenthesis = function () {
        if (!this.parensStack) {
            this.parensStack = [];
        }
        this.parensStack.push(true);
    };

    tree.evalEnv.prototype.outOfParenthesis = function () {
        this.parensStack.pop();
    };

    tree.evalEnv.prototype.isMathOn = function () {
        return this.strictMath ? (this.parensStack && this.parensStack.length) : true;
    };

    tree.evalEnv.prototype.isPathRelative = function (path) {
        return !/^(?:[a-z-]+:|\/)/.test(path);
    };

    tree.evalEnv.prototype.normalizePath = normalizePath;

    //todo - do the same for the toCSS env
    //tree.toCSSEnv = function (options) {
    //};

    var copyFromOriginal = function(original, destination, propertiesToCopy) {
        if (!original) { return; }

        for(var i = 0; i < propertiesToCopy.length; i++) {
            if (original.hasOwnProperty(propertiesToCopy[i])) {
                destination[propertiesToCopy[i]] = original[propertiesToCopy[i]];
            }
        }
    };

    // resolves . and .. elements in a path array with directory names there
    // must be no slashes, empty elements, or device names (c:\) in the array
    // (so also no leading and trailing slashes - it does not distinguish
    // relative and absolute paths)
    function normalizeArray(parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0, last, i;
        for (i = parts.length - 1; i >= 0; i--) {
            last = parts[i];
            if (last === '.') {
                parts.splice(i, 1);
            } else if (last === '..') {
                parts.splice(i, 1);
                up++;
            } else if (up) {
                parts.splice(i, 1);
                up--;
            }
        }

        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
            for (; up--; up) {
                parts.unshift('..');
            }
        }

        return parts;
    }

    // path.normalize(path)
    function normalizePath(path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';

        // Normalize the path
        path = normalizeArray(path.split('/').filter(function (p) {
            return !!p;
        }), !isAbsolute).join('/');

        if (!path && !isAbsolute) {
            path = '.';
        }
        if (path && trailingSlash) {
            path += '/';
        }

        return (isAbsolute ? '/' : '') + path;
    }

})(require('./tree'));
