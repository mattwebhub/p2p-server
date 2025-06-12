import axios from "axios";

const BASE_URL = "http://localhost:3000/crawler"; // Assuming p2p-server runs on port 3000

async function testCrawlerApi() {
  const sessionId = `test-session-${Date.now()}`;
  const chatUrl = "https://www.google.com"; // Replace with a real chat URL for actual testing

  console.log(`Starting crawler session for ${chatUrl} with ID ${sessionId}...`);
  try {
    const startResponse = await axios.post(`${BASE_URL}/start`, {
      sessionId,
      chatUrl,
      config: {},
    });
    console.log("Start response:", startResponse.data);
  } catch (error: any) {
    console.error("Error starting crawler:", error.response?.data || error.message);
    return;
  }

  console.log(`Getting status for session ${sessionId}...`);
  try {
    const statusResponse = await axios.get(`${BASE_URL}/status/${sessionId}`);
    console.log("Status response:", statusResponse.data);
  } catch (error: any) {
    console.error("Error getting status:", error.response?.data || error.message);
  }

  console.log(`Sending message in session ${sessionId}...`);
  try {
    const messageResponse = await axios.post(`${BASE_URL}/send-message`, {
      sessionId,
      message: "Hello from test script!",
    });
    console.log("Message send response:", messageResponse.data);
  } catch (error: any) {
    console.error("Error sending message:", error.response?.data || error.message);
  }

  console.log(`Stopping crawler session ${sessionId}...`);
  try {
    const stopResponse = await axios.post(`${BASE_URL}/stop`, {
      sessionId,
    });
    console.log("Stop response:", stopResponse.data);
  } catch (error: any) {
    console.error("Error stopping crawler:", error.response?.data || error.message);
  }
}

testCrawlerApi();


