const http = require("http");
const fs = require("fs");
const path = require("path");

let data = [];

// Load data.json
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

function getQueryParam(url, key) {
  const parts = url.split("?");
  if (parts.length < 2) return null;
  const params = new URLSearchParams(parts[1]);
  return params.has(key) ? params.get(key) : null;
}

const server = http.createServer((req, res) => {
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
  } else if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    let html = `
    <link rel="stylesheet" href="/style.css"/>
    <div style="width: 95%; margin: 0 auto">
    <h1 style="margin-top: 3rem;">JSON CRUD (Create, Read, Update, Delete)</h1>
    <a href="/add">Create</a>
    <div>
      <table>
        <thead><tr><th>No.</th><th>Name</th><th>Height</th><th>Weight</th><th>Birth Date</th><th>Is Married</th><th>Actions</th></tr></thead>`;
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
          <a href="/delete?id=${index}" onclick="return confirm('Apakah anda ingin mendeletes data: ${item.name}')">Delete</a>
        </td>
      </tr>`;
    });
    html += `</table></div></div>`;
    res.write(html);
    res.end();
  } else if (req.url === "/add") {
    res.writeHead(200, { "Content-Type": "text/html" });
    let form = `
      <link rel="stylesheet" href="/style.css"/>
      <div style="width: 95%; margin: 0 auto">
      <form method="POST" action="/add-item" style="border: .1rem solid #e0e0e0; padding: 1rem;">
        <input type="text" name="name" placeholder="name" required /><br />
        <input type="number" placeholder="height" name="height" required /><br />
        <input type="number" type name="weight" placeholder="weight" required /><br />
        <input type="date" name="birthdate" placeholder="birthdate" required /><br />
        <select name="married" required>
          <option value="" disabled selected>Is Married?</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select><br/>  
        <button type="submit" class ="submit-button">Save</button>
        <button type="button" class ="cancel-button" onclick="window.location.href='/';">Cancel</button>
      </form>
      </div>`;
    res.write(form);
    res.end();
  } else if (req.url === "/add-item" && req.method === "POST") {
    let body = '';
    req.on("data", content => body += content.toString());
    req.on("end", () => {
      const params = new URLSearchParams(body);
      const newEntry = {
        name: params.get("name"),
        height: params.get("height"),
        weight: params.get("weight"),
        birthdate: params.get("birthdate"),
        married: params.get("married") === "true"
      };
      data.push(newEntry);
      fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
      res.writeHead(301, { Location: "/" });
      res.end();
    });
  } else if (req.url.startsWith("/update")) {
    const id = parseInt(getQueryParam(req.url, "id"), 10);
    if (!isNaN(id) && id >= 0 && id < data.length) {
      const item = data[id];
      res.writeHead(200, { "Content-Type": "text/html" });
      let form = `
      <link rel="stylesheet" href="/style.css"/>
      <div style="width: 100%; margin: 0 auto">
      <form method="POST" action="/update-item" style="border: .1rem solid #e0e0e0; padding: 1rem;">
        <input type="hidden" name="id" value="${id}" />
        <input type="text" name="name" value="${item.name}" required /><br />
        <input type="number" name="height" value="${item.height}" required /><br />
        <input type="number" name="weight" value="${item.weight}" required /><br />
        <input type="date" name="birthdate" value="${item.birthdate}" required /><br />
        <select name="married" required>
          <option value="true" ${item.married ? "selected" : ""}>true</option>
          <option value="false" ${!item.married ? "selected" : ""}>false</option>
        </select>
        <br />
        <button type="submit" class="submit-button">Save</button>
        <button type="button" class="cancel-button" onclick="window.location.href='/';">Cancel</button>
      </form>`;
      res.write(form);
      res.end();
    } else if (req.url === "/update-item" && req.method === "POST") {
      let body = '';
      req.on("data", content => body += content.toString());
      req.on("end", () => {
        const params = new URLSearchParams(body);
        const id = parseInt(params.get("id"), 10);
        if (!isNaN(id) && id >= 0 && id < data.length) {
          data[id] = {
            name: params.get("name"),
            height: params.get("height"),
            weight: params.get("weight"),
            birthdate: params.get("birthdate"),
            married: params.get("married") === "true"
          };
          fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
        }
        res.writeHead(301, { Location: "/" });
        res.end();
      });
    }
  } else if (req.url.startsWith("/delete") && req.method === "GET") {
    const id = parseInt(getQueryParam(req.url, "id"), 10);
    if (!isNaN(id) && id >= 0 && id < data.length) {
      data.splice(id, 1);
      try {
        fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
        res.writeHead(302, { Location: "/" });
      } catch (err) {
        console.error("Error saving data after deletion:", err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Error saving data after deletion.");
      }
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Data not found or invalid ID.");
    }
    res.end();
  }
});
server.listen(3000, () => {
  console.log("Server running on port 3000");
});