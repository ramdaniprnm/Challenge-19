const http = require("http");
const fs = require("fs");
const path = require("path");

let data = [];

// membaca data.json
if (fs.existsSync("data.json")) {
  try {
    data = JSON.parse(fs.readFileSync("data.json"));
    if (!Array.isArray(data)) data = [];
  } catch (err) {
    console.log("Unable to read JSON:", err);
    data = [];
  }
} else {
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

// Start server
const server = http.createServer((req, res) => {
  console.log(`Request URL: ${req.url}`);
  if (req.url === "/style.css") {
    fs.readFile(path.join(__dirname, "public", "style.css"), (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("CSS file not found");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end(content);
    });
    return;
  }

  // home/main rute 
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    let html = `
    <link rel="stylesheet" href="/style.css"/>
    <div style="width: 95%; margin: 0 auto ">
    <h1 style="margin-top: 3rem;">JSON CRUD (Create, Read, Update, Delete)</h1>
    <a href="/add">Create</a>
    <div style="border: .1rem solid #030101;">
      <table>
        <thead><th>No.</th><th>Name</th><th>Height</th><th>Weight</th><th>Birth Date</th><th>Is Married</th><th>Actions</th></thead>`;
    data.forEach((item, index) => {
      html += `<tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.height}</td>
        <td>${item.weight}</td>
        <td>${item.birthdate}</td>
        <td>${item.married}</td>
        <td>
          <a href="/update?id=${index}">Update</a> 
          <a href="/delete?id=${index}" onclick="return confirm('Apakah anda ingin mendelete data: ${item.name}')">Delete</a>
        </td>
        </tr>`;
    });
    html += `</table></div></div>`;
    res.write(html);
    res.end();
  }

  // rute add
  if (req.url === "/add") {
    res.writeHead(200, { "Content-Type": "text/html" });
    let form = `
      <link rel="stylesheet" href="/style.css"/>
      <div style="width: 100%; margin: 0 auto">
      <form method="POST" action="/add-item" style="border: .1rem solid #e0e0e0; padding: 1rem;">
        <input type="text" name="name" placeholder="name" required /><br />
        <input type="number" placeholder="height" name="height" required /><br />
        <input type="number" name="weight" placeholder="weight" required /><br />
        <input type="date" name="birthdate" placeholder="birthdate" required /><br />
        <select name="married" required>
          <option value="" disabled selected>Atos Nikah?</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select><br/>  
        <button type="submit" class="submit-button">Save</button>
        <button type="button" class="cancel-button" onclick="window.location.href='/';">Cancel</button>
      </form>
      </div>`;
    res.write(form);
    res.end();
  }

  // funsgsi add 
  if (req.url === "/add-item" && req.method === "POST") {
    let body = '';
    req.on("data", content => body += content.toString());
    req.on("end", () => {
      const params = new URLSearchParams(body);
      const newItem = {
        name: params.get("name"),
        height: params.get("height"),
        weight: params.get("weight"),
        birthdate: params.get("birthdate"),
        married: params.has("married") ? "true" : "false"
      };
      data.push(newItem);
      fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
      res.writeHead(301, { Location: "/" });
      res.end();
    });
  }

  // fungsi Update 
  if (req.url === "/update-item" && req.method === "POST") {
    let body = '';
    req.on("data", content => body += content.toString());
    req.on("end", () => {
      const params = new URLSearchParams(body);
      const newEdit = {
        id: params.get("id"),
        name: params.get("name"),
        height: params.get("height"),
        weight: params.get("weight"),
        birthdate: params.get("birthdate"),
        married: params.get("married") === "true" ? "true" : "false"
      };
      data.splice(newEdit.id, 1, newEdit);
      fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
      res.writeHead(301, { Location: "/" });
      res.end();
    });
  }
  // Update rute
  if (req.url.startsWith("/update")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = parseInt(url.searchParams.get("id"), 10);
    if (!isNaN(id) && id >= 0 && id < data.length) {
      const item = data[id];
      res.writeHead(200, { "Content-Type": "text/html" });
      let form = `
      <link rel="stylesheet" href="/style.css"/>
      <div style="width: 100%; margin: 0 auto">
      <form method="POST" action="/update-item" style="border: .1rem solid #e0e0e0; padding: 1rem;">
        <input type="hidden" name="id" value="${id}" />
        <input type="text" name="name" value="${item.name}" placeholder="name" required /><br />
        <input type="number" name="height" step="1" value="${item.height}" placeholder="height" required /><br />
        <input type="number" name="weight" step="0.1" value="${item.weight}" placeholder="weight" required /><br />
        <input type="date" name="birthdate" value="${item.birthdate}" placeholder="birthdate" required /><br />
        <select name="married" required>
          <option value="true" ${item.married === "true" ? "selected" : ""}>true</option>
          <option value="false" ${item.married !== "true" ? "selected" : ""}>false</option>
        </select>
        <br />
      <button type="submit" class="submit-button">Save</button>
      <button type="button" class="cancel-button" onclick="window.location.href='/';">Cancel</button>
      </form>`;
      res.write(form);
      res.end();
    }
  }
  if (req.url.startsWith('/delete') && req.method === 'GET') {
    // Parse the URL to get the query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = parseInt(url.searchParams.get('id'), 10); // Get `id` from query string

    // Check if `id` is valid
    if (!isNaN(id) && id >= 0 && id < data.length) {
      // Delete the item from the data array
      data.splice(id, 1);

      // Update the data.json file
      fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
      console.log("Data deleted successfully");

      // Redirect to home page
      res.writeHead(301, { Location: '/' });
      res.end();
    } else {
      console.log("Invalid ID");
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Data not found");
    }
  }
})


server.listen(3000, () => {
  console.log(`Server berjalan di 3000`);
});