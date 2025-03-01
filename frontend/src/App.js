import './App.css';
import Table from "./Table";
import Sidebar from "./Sidebar";
//import { useState } from "react";

function App() {
  return (
    <div className="container">
      <h1>Title</h1>
      <div className="body">
        <Table />
        <Sidebar />
      </div>
    </div>
  );
}

export default App;
