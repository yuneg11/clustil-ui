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

async function updateMemoSaige({
  nodeId,
  gpuId,
  text,
}: UpdateMemoParams): Promise<{ success: boolean }> {
  const { rowIndexMap } = await import("@/hooks/useSaige");

  const key = `${nodeId}:${gpuId}`;
  const idx = rowIndexMap.get(key);

  if (idx === undefined) {
    throw new Error(`No row index found for ${key}`);
  }

  const formBody = `${idx}=${encodeURIComponent(text)}`;

  const response = await fetch("/update_user", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
    redirect: "manual",
  });

  if (
    response.type === "opaqueredirect" ||
    response.ok ||
    (response.status >= 300 && response.status < 400)
  ) {
    return { success: true };
  }

  throw new Error("Failed to update memo");
}

const updateMemo =
  import.meta.env.MODE === "demo"
    ? updateMemoDemo
    : import.meta.env.MODE === "saige"
      ? updateMemoSaige
      : updateMemoAPI;

export { updateMemo };
