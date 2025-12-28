const ext = (typeof browser !== "undefined") ? browser : chrome;

function storageSyncGet(keys) {
  return new Promise((resolve) => {
    const maybePromise = ext.storage.sync.get(keys, (result) => resolve(result));
    if (maybePromise && typeof maybePromise.then === "function") {
      maybePromise.then(resolve);
    }
  });
}

function storageSyncSet(obj) {
  return new Promise((resolve) => {
    const maybePromise = ext.storage.sync.set(obj, () => resolve());
    if (maybePromise && typeof maybePromise.then === "function") {
      maybePromise.then(() => resolve());
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const batchSizeRange = document.getElementById("batchSizeRange");
  const batchSizeValue = document.getElementById("batchSizeValue");
  const saveButton = document.getElementById("saveButton");

  // Load and apply saved settings
  const data = await storageSyncGet("batchSize");
  if (data.batchSize) {
    batchSizeRange.value = data.batchSize;
    batchSizeValue.textContent = `${data.batchSize} messages`;
  }

  // Update displayed value when range input changes
  batchSizeRange.addEventListener("input", () => {
    batchSizeValue.textContent = `${batchSizeRange.value} messages`;
  });

  // Save settings when button is clicked
  saveButton.addEventListener("click", async () => {
    const selectedSize = batchSizeRange.value;
    await storageSyncSet({ batchSize: selectedSize });
    alert("Settings saved. Please reload the chat page for changes to take effect.");
  });
});
