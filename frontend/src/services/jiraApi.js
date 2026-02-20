export const createTicket = async (summary, description) => {
  const response = await fetch("http://localhost:5000/create-ticket", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary,
      description
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
};
