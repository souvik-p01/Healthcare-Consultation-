import net from 'net';

// Override the listen method on the net.Server prototype to prevent starting the port listener
net.Server.prototype.listen = function() {
    console.log("Mocked NET Server listen called!");
    const callback = arguments[arguments.length - 1];
    if (typeof callback === 'function') {
        process.nextTick(callback);
    }
    return this;
};

// Now import index.js which will boot the application and build the routes stack
import { app } from './src/index.js';

const printRouter = (router, depth = 0) => {
    const indent = "  ".repeat(depth);
    if (!router || !router.stack) {
        console.log(`${indent}(No stack or empty router)`);
        return;
    }
    router.stack.forEach((layer, idx) => {
        const name = layer.name || 'anonymous';
        const path = layer.route ? layer.route.path : 'none';
        console.log(`${indent}Layer ${idx}: name=${name}, path=${path}`);
        
        // Traverse nested routers
        if (layer.handle && (layer.name === 'router' || layer.handle.stack)) {
            printRouter(layer.handle, depth + 1);
        }
    });
};

// Delay route printing slightly to allow connections to finalize
setTimeout(() => {
    console.log("App Object:", typeof app, app ? "defined" : "undefined");
    if (app) {
        const routerObj = app.router || app._router;
        if (routerObj) {
            console.log("\n--- TRACING EXPRESS ROUTER LAYERS ---");
            printRouter(routerObj, 0);
            console.log("-------------------------------------\n");
        }
    }
    process.exit(0);
}, 2000);
