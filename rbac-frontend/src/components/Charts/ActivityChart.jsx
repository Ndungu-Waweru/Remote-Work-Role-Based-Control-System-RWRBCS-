import React from "react";
import {
BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer
} from "recharts";

const data = [
{day:"Mon",users:4},
{day:"Tue",users:7},
{day:"Wed",users:2},
{day:"Thu",users:9},
{day:"Fri",users:5}
];

function ActivityChart(){

return(

<div style={{width:"100%",height:300}}>

<ResponsiveContainer>

<BarChart data={data}>
<XAxis dataKey="day"/>
<YAxis/>
<Tooltip/>
<Bar dataKey="users" fill="#3b82f6"/>
</BarChart>

</ResponsiveContainer>

</div>

)

}

export default ActivityChart;