export async function apiFetch(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    }
  };

  const response = await fetch(endpoint, finalOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 500 || !errorData.message) {
      throw new Error('Something went wrong. Please try again.');
    }
    throw new Error(errorData.message);
  }

  return response.json();
}
