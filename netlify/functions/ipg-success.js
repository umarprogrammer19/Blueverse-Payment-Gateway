exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  console.log("IPG SUCCESS RAW BODY:", event.body);

  const formData = new URLSearchParams(event.body);
  const data = Object.fromEntries(formData.entries());
  const transactionId = data.ipgTransactionId;
  const respCode = data.processor_response_code;
  // Simple status
  const status =
    respCode === "00" ? "success" : "failed";

  console.log("PARSED IPG DATA:", data);

  const params = new URLSearchParams({
    status,
    transactionId: transactionId || "",
  }).toString();

  return {
    statusCode: 302,
    headers: {
      Location: `/success?${params}`,
    },
  };
};
