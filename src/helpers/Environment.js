exports.isProduction = () => {
    const value = Number(process.env.HELLO_WORLD_DETA)
    return value === 1
}

exports.isLocal = () => {
    const value = Number(process.env.HELLO_WORLD_DETA)
    return value !== 1
}

exports.getEnvName = () => {
    if (exports.isLocal()) return 'Local'
    if (exports.isProduction()) return 'Production'
    return 'Unknown'
}
