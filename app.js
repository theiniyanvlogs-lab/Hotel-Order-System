const channel = new BroadcastChannel("hotel");
let orders = JSON.parse(localStorage.getItem("orders") || "[]");

function save(){
  localStorage.setItem("orders", JSON.stringify(orders));
  channel.postMessage("update");
}

function sendOrder(){
  const table = document.getElementById("table").value;
  const dish = document.getElementById("dish").value;
  orders.push({table, dish, status:"Kitchen"});
  save();
}

function finishOrder(i){ orders[i].status="Supply"; save(); }
function serve(i){ orders[i].status="Done"; save(); }

function renderKitchen(){
  const l=document.getElementById("kitchenList"); if(!l)return;
  l.innerHTML="";
  orders.filter(o=>o.status==="Kitchen").forEach((o,i)=>{
    l.innerHTML+=`<li>Table ${o.table} - ${o.dish} <button onclick="finishOrder(${i})">Finish</button></li>`;
  });
}

function renderSupply(){
  const l=document.getElementById("supplyList"); if(!l)return;
  l.innerHTML="";
  orders.filter(o=>o.status==="Supply").forEach((o,i)=>{
    l.innerHTML+=`<li>Serve ${o.table} - ${o.dish} <button onclick="serve(${i})">Served</button></li>`;
  });
}

function renderStatus(){
  const l=document.getElementById("status"); if(!l)return;
  l.innerHTML="";
  orders.forEach(o=>l.innerHTML+=`<li>${o.table} - ${o.dish} → ${o.status}</li>`);
}

channel.onmessage=()=>{
  orders=JSON.parse(localStorage.getItem("orders")||"[]");
  renderKitchen(); renderSupply(); renderStatus();
};

renderKitchen(); renderSupply(); renderStatus();