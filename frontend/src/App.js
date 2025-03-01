import './App.css';
import Table from "./Table";
//import { useState } from "react";

function App() {
  return (
    <div className="container">
      <h1>Title</h1>
      <h2>{}</h2>
      <aside>
        <button className="button" onClick={() => console.log("a")}>button</button>
        <button className="button" onClick={() => console.log("b")}>button</button>
      </aside>
      <div id="tableHolder">
        <Table />
      </div>
    </div>
  );
}

export default App;
