const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

function isLocalTarget(rawUrl) {
  const url = new URL(rawUrl || 'http://localhost:3000')
  return LOCAL_HOSTS.has(url.hostname)
}

function assertSafeTestTarget(rawUrl = process.env.BASE_URL || 'http://localhost:3000') {
  if (process.env.ALLOW_REMOTE_TEST_WRITES === 'true') {
    return
  }

  if (!isLocalTarget(rawUrl)) {
    throw new Error(
      `Refusing to run write-capable tests against ${rawUrl}. ` +
        'Set ALLOW_REMOTE_TEST_WRITES=true only for a dedicated test environment.'
    )
  }
}

module.exports = {
  assertSafeTestTarget,
  isLocalTarget,
}
