module.exports = {
    apps : [{
        name: "lh-api",
        script: "server.js",
        env: {
            PORT: 3000,
            NODE_ENV: "production"
        }
    }]
}