// netlify/functions/ipg-fail.js
exports.handler = async (event) => {
  console.log("IPG FAIL CALLBACK", event.httpMethod, event.body);

  return {
    statusCode: 302,
    headers: {
      Location: "/failure",
    },
  };
};
