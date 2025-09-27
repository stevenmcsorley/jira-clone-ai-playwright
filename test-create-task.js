/**
 * Simple test to create one task
 */

const http = require('http');

const testTask = {
  title: "Test Task Creation",
  description: "Simple test task",
  type: "task",
  projectId: 1,
  reporterId: 1
};

const createTask = (taskData) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(taskData);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/issues',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

async function testCreate() {
  try {
    console.log('Testing task creation...');
    const result = await createTask(testTask);
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCreate();