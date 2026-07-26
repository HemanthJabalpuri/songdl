var http = require("http");
var https = require("https");
var fs = require("fs");
var path = require("path");
var url = require("url");

var CONFIG = {
    host: "127.0.0.1",
    port: 3000,
    root: "./src",
    proxy: "/proxy",
    bundle: "/bundle",
    bundlefile: path.join(__dirname, "dist", "song-downloader.user.js")
};

// ============ UTILITIES ============
function getRequestPathname(req) {
    var parsed = url.parse(req.url || "");
    var pathname = parsed.pathname || "/";
    try {
        return decodeURIComponent(pathname);
    } catch (e) {
        return pathname;
    }
}

function resolveSafeFilePath(rootDirectory, pathname) {
    var normalizedPathname = pathname === "/" ? "/index.html" : pathname;
    var resolvedRoot = path.resolve(rootDirectory);
    var targetFile = path.resolve(resolvedRoot, "." + normalizedPathname);

    if (targetFile.indexOf(resolvedRoot) !== 0) {
        return null;
    }
    return targetFile;
}

// ============ STATIC FILE SERVER ============
function serveFile(req, res, config) {
    var pathname = getRequestPathname(req);
    var filePath = resolveSafeFilePath(config.root, pathname);

    if (!filePath) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        return res.end("Forbidden");
    }

    fs.stat(filePath, function(err, stat) {
        if (err || !stat.isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            return res.end("Not Found");
        }

        var ext = path.extname(filePath).toLowerCase();
        var mimeTypes = {
            ".html": "text/html",
            ".css": "text/css",
            ".js": "application/javascript",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
            ".txt": "text/plain",
            ".map": "application/json"
        };
        var contentType = mimeTypes[ext] || "application/octet-stream";

        res.writeHead(200, { "Content-Type": contentType });
        
        var stream = fs.createReadStream(filePath);
        stream.on("error", function(streamErr) {
            if (!res.headersSent) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Internal Server Error");
            }
        });
        stream.pipe(res);
    });
}

// ============ PROXY ============
function proxy(req, res) {
    var targetUrl = req.headers["x-proxy-url"];

    if (!targetUrl) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Missing X-Proxy-URL");
    }

    var parsedTarget = url.parse(targetUrl);
    var clientModule = parsedTarget.protocol === "https:" ? https : http;

    var headers = {};
    var headerKeys = Object.keys(req.headers);
    for (var i = 0; i < headerKeys.length; i++) {
        var k = headerKeys[i];
        var key = k.toLowerCase();
        
        if (
            key === "host" ||
            key === "origin" ||
            key === "referer" ||
            key === "connection" ||
            key === "content-length" ||
            key === "x-proxy-url" ||
            key === "x-proxy-user-agent" ||
            key === "x-proxy-cookie" ||
            key.indexOf("sec-") === 0
        ) {
            continue;
        }
        headers[k] = req.headers[k];
    }

    if (req.headers["x-proxy-user-agent"]) {
        headers["User-Agent"] = req.headers["x-proxy-user-agent"];
    }

    if (req.headers["x-proxy-cookie"]) {
        headers["Cookie"] = req.headers["x-proxy-cookie"];
    }

    headers["Accept-Encoding"] = "identity";

    var options = {
        protocol: parsedTarget.protocol,
        hostname: parsedTarget.hostname,
        port: parsedTarget.port,
        path: parsedTarget.path,
        method: req.method,
        headers: headers,
        rejectUnauthorized: false
    };

    var bodyChunks = [];
    req.on("data", function(chunk) {
        bodyChunks.push(chunk);
    });

    req.on("end", function() {
        if (bodyChunks.length > 0) {
            var totalLength = 0;
            for (var c = 0; c < bodyChunks.length; c++) {
                totalLength += bodyChunks[c].length;
            }
            options.headers["Content-Length"] = totalLength;
        }

        var proxyReq = clientModule.request(options, function(proxyRes) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Headers", "*");
            res.setHeader("Access-Control-Allow-Methods", "*");

            var proxyResKeys = Object.keys(proxyRes.headers);
            for (var j = 0; j < proxyResKeys.length; j++) {
                var pk = proxyResKeys[j];
                var lowerPK = pk.toLowerCase();
                if (
                    lowerPK === "content-length" ||
                    lowerPK === "transfer-encoding" ||
                    lowerPK === "content-encoding"
                ) {
                    continue;
                }
                res.setHeader(pk, proxyRes.headers[pk]);
            }

            res.writeHead(proxyRes.statusCode);
            proxyRes.pipe(res);
        });

        proxyReq.on("error", function(err) {
            console.error("CRITICAL PROXY ERROR:", err.stack || err);
            if (!res.headersSent) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    status: false,
                    message: err.message
                }));
            }
        });

        if (bodyChunks.length > 0) {
            for (var b = 0; b < bodyChunks.length; b++) {
                proxyReq.write(bodyChunks[b]);
            }
        }
        proxyReq.end();
    });

    req.on("error", function(err) {
        if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: false, message: err.message }));
        }
    });
}

// ============ BUNDLE SERVER ============
function serveBundle(req, res, config) {
    fs.readFile(config.bundlefile, "utf8", function(err, bundleContent) {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/html" });
            return res.end(
                "<h1>Bundle not found</h1>" +
                "<p>Run <code>npm run build</code> first</p>" +
                "<p><a href=\"/\">Go to split mode</a></p>"
            );
        }
        
        var html = "<!DOCTYPE html>\n<html>\n<head>\n" +
            "<meta charset=\"UTF-8\">\n" +
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
            "<title>Userscript Test - Bundle</title>\n" +
            "<style>body { background: #111; color: #fff; font-family: sans-serif; padding: 20px; }</style>\n" +
            "</head>\n<body>\n<h1>📦 Bundle Mode</h1>\n" +
            "<p><a href=\"/\">← Back to split mode</a></p>\n" +
            "<script>window.isProxy = true;</script>" +
            "<script>" + bundleContent + "</script>\n" +
            "</body>\n</html>";

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    });
}

// ============ MAIN SERVER ============
http.createServer(function(req, res) {
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.setHeader("Access-Control-Allow-Methods", "*");
        res.writeHead(204);
        return res.end();
    }

    var pathname = getRequestPathname(req);
    console.log(req.method + " " + pathname);

    if (pathname === CONFIG.proxy) {
        return proxy(req, res);
    }

    if (pathname === CONFIG.bundle) {
        return serveBundle(req, res, CONFIG);
    }

    serveFile(req, res, CONFIG);

}).listen(CONFIG.port, CONFIG.host, function() {
    console.log("Server running at http://" + CONFIG.host + ":" + CONFIG.port);
});
