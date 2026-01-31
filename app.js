/***********************
 🔔 Sound Notification
************************/
const bell = new Audio("bell.mp3");

/***********************
 🔥 Firebase Init
************************/
firebase.initializeApp({
  apiKey: "AIzaSyA30h8eWE0kbvDWxxjV5cakUHtTY1AZfrQ",
  authDomain: "hotel-order-system-7924f.firebaseapp.com",
  projectId: "hotel-order-system-7924f",
  storageBucket: "hotel-order-system-7924f.appspot.com",
  messagingSenderId: "342855941864",
  appId: "1:342855941864:web:83be6867138a28d814135d"
});

const db = firebase.firestore();
const ordersRef = db.collection("orders");

/***********************
 📥 ORDER TAKER
************************/
function sendOrder() {
  const table = document.getElementById("table").value;
  const dish = document.getElementById("dish").value;

  if (!dish) {
    alert("Please enter dish name");
    return;
  }

  ordersRef.add({
    table: table,
    dish: dish,
    status: "Kitchen",
    time: Date.now()
  });

  document.getElementById("dish").value = "";
}

/***********************
 👨‍🍳 KITCHEN
************************/
function finishOrder(id) {
  ordersRef.doc(id).update({
    status: "Supply"
  });
}

/***********************
 🚶 SUPPLY
************************/
function serve(id) {
  ordersRef.doc(id).update({
    status: "Done"
  });
}

/***********************
 🔄 REAL-TIME LISTENER
************************/
let lastCount = 0;

ordersRef.orderBy("time").onSnapshot(snapshot => {

  const docs = snapshot.docs;

  // 🔔 Play sound ONLY on Kitchen page for NEW orders
  if (docs.length > lastCount) {
    if (document.getElementById("kitchenList")) {
      bell.play().catch(() => {});
    }
  }
  lastCount = docs.length;

  const status = document.getElementById("status");
  const kitchen = document.getElementById("kitchenList");
  const supply = document.getElementById("supplyList");

  if (status) status.innerHTML = "";
  if (kitchen) kitchen.innerHTML = "";
  if (supply) supply.innerHTML = "";

  docs.forEach(doc => {
    const o = doc.data();

    /******** ORDER TAKER VIEW ********/
    if (status) {
      let cls =
        o.status === "Kitchen" ? "status-kitchen" :
        o.status === "Supply" ? "status-supply" :
        "status-done";

      status.innerHTML += `
        <div class="card ${cls}">
          <h3>Table ${o.table}</h3>
          <p>${o.dish}</p>
          <strong>${o.status}</strong>
        </div>
      `;
    }

    /******** KITCHEN VIEW ********/
    if (kitchen && o.status === "Kitchen") {
      kitchen.innerHTML += `
        <div class="card status-kitchen">
          <h3>Table ${o.table}</h3>
          <p>${o.dish}</p>
          <button class="btn-finish"
            onclick="finishOrder('${doc.id}')">
            Finish
          </button>
        </div>
      `;
    }

    /******** SUPPLY VIEW ********/
    if (supply && o.status === "Supply") {
      supply.innerHTML += `
        <div class="card status-supply">
          <h3>Table ${o.table}</h3>
          <p>${o.dish}</p>
          <button class="btn-serve"
            onclick="serve('${doc.id}')">
            Served
          </button>
        </div>
      `;
    }

  });
});
