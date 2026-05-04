export type ActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export async function runServerAction<T>(
  action: () => Promise<T>,
  fallbackMessage: string
): Promise<ActionResult<T>> {
  try {
    return {
      ok: true,
      data: await action(),
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, fallbackMessage),
    };
  }
}