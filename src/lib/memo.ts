interface UpdateMemoParams {
  nodeId: string;
  gpuId: string;
  text: string;
}

async function updateMemoDemo(): Promise<{ success: boolean }> {
  // Dummy implementation for demo mode
  return Promise.resolve({ success: true });
}

async function updateMemoAPI({
  nodeId,
  gpuId,
  text,
}: UpdateMemoParams): Promise<{ success: boolean }> {
  const response = await fetch(`${import.meta.env.CLUSTIL_HOST}/api/memo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nodeId, gpuId, text }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update memo: ${response.statusText}`);
  }

  return response.json();
}

const updateMemo = import.meta.env.MODE === "demo" ? updateMemoDemo : updateMemoAPI;

export { updateMemo };
