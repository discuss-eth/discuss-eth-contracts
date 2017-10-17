export async function expectError(func) {
  let didError = false;
  try {
    await func();
  } catch (error) {
    didError = true;
  }
  assert.strictEqual(didError, true);
}