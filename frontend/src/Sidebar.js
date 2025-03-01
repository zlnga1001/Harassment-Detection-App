export default function Sidebar(){
    return(
      <aside className="sidebar">
        <button className="button" onClick={() => console.log("a")}>button</button>
        <button className="button" onClick={() => console.log("b")}>button</button>
      </aside>
    )
}