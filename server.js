const http = require("http");
const fs = require("fs");
const path = require("path");

let data = [];

// membaca data dari data.json
if (fs.existsSync("data.json")) {
  try {
    data = JSON.parse(fs.readFileSync("data.json"));
    if (!Array.isArray(data)) {
      data = [];
    }
  } catch (err) {
    console.log("tidak bisa membaca json: ", err);
    data = [];
  }
} else {
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

// mulai server
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
  }

  // Route untuk halaman utama
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    let html = `<link rel="stylesheet" href="/style.css"/>
      <a href="/add">Create</a>
      <h1>JSON CRUD(Create, Read, Update, Delete)</h1>
      <table border="1">
        <tr><th>No.</th><th>Name</th><th>Height</th><th>Weight</th><th>Birth Date</th><th>Is Married</th><th>Actions</th></tr>`;
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
          <a href="/delete?id=${index}" onclick="return confirm('Apakah kamu yakin akan menghapus data ${item.name}?')">Delete</a>
        </td>
      </tr>`;
    });
    html += `</table>`;
    res.write(html);
    res.end();
  }

  // Route untuk menambah data
  else if (req.url === "/add") {
    res.writeHead(200, { "Content-Type": "text/html" });
    let form = `
      <form method="POST" action="/add-item">
        <label for="name">Name:</label><input type="text" name="name" required /><br />
        <label for="height">Height:</label><input type="text" name="height" required /><br />
        <label for="weight">Weight:</label><input type="text" name="weight" required /><br />
        <label for="birthdate">Birth Date:</label><input type="date" name="birthdate" required /><br />
        <label for="married">Is Married:</label><input type="checkbox" name="married" /><br />
        <button type="submit">Add Item</button>
      </form>`;
    res.write(form);
    res.end();
  }

  // Route untuk menangani pengiriman data baru
  else if (req.url === "/add-item" && req.method === "POST") {
    let body = '';
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      const params = new URLSearchParams(body);
      const newItem = {
        name: params.get("name"),
        height: params.get("height"),
        weight: params.get("weight"),
        birthdate: params.get("birthdate"),
        married: params.has("married") ? "Yes" : "No"
      };
      data.push(newItem);
      fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
      res.writeHead(301, { Location: "/" });
      res.end();
    });
  }

  // Route untuk menghapus data
  else if (req.url.startsWith("/delete")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get("id");
    const index = data.findIndex(item => item.name === id);
    if (index !== -1) {
      data.splice(index, 1);
      fs.writeFile("data.json", JSON.stringify(data, null), (err) => {
        if (err) {
          console.log(err);
        }
      });
      res.writeHead(301, { Location: "/" });
    } else {
      res.write("<h1>Delete berada di halaman depan</h1>");
    }
    res.end();
  }
  // Route untuk menangani error 404
  else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.write("<h1>404 TEU AYA NANAON!</h1>");
    res.end();
  }
});

server.listen(5000, () => {
  console.log("Server berjalan di port 5000");
});
