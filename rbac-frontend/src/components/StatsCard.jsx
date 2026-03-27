import React from "react";

function StatsCard({title,value}){

  return(

    <div style={{
      background:"#fff",
      padding:"20px",
      border:"1px solid #ddd",
      borderRadius:"8px",
      width:"150px"
    }}>

      <h3>{title}</h3>
      <p>{value}</p>

    </div>

  )

}

export default StatsCard;