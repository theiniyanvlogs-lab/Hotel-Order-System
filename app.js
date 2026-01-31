/***********************
 🔔 Bell Sound (loop)
************************/
const bell = new Audio("bell.mp3");
bell.loop = true;

/***********************
 👤 STAFF ID
************************/
const STAFF_ID =
  localStorage.getItem("staffId") ||
  prompt("Enter your name (Chef / Supply):");

localStorage.setItem("staffId", STAFF_ID);

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
    alert("Enter dish name");
    return;
  }

  ordersRef.add({
    table,
    dish,
    status: "Kitchen",
    assignedTo: null,
    ringing: true,      // 🔔 start ringing for kitchen
    time: Date.now()
  });

  document.getElementById("dish").value = "";
}

/***********************
 👨‍🍳 KITCHEN ACTIONS
************************/
function acceptKitchen(id) {
  ordersRef.doc(id).update({
    assignedTo: STAFF_ID,
    ringing: false     // 🔕 STOP bell for all kitchens
  });
}

function finishOrder(id) {
  ordersRef.doc(id).update({
    status: "Supply",
    assignedTo: null,
    ringing: true      // 🔔 start ringing for suppliers
  });
}

/***********************
 🚶 SUPPLY ACTIONS
************************/
function acceptSupply(id) {
  ordersRef.doc(id).update({
    assignedTo: STAFF_ID,
    ringing: false     // 🔕 STOP bell for all suppliers
  });
}

function serve(id) {
  ordersRef.doc(id).update({
    status: "Done",
    assignedTo: null,
    ringing: false
  });
}

/***********************
 🔄 REAL-TIME LISTENER
************************/
ordersRef.orderBy("time").onSnapshot(snapshot => {

  const docs = snapshot.docs;

  const status = document.getElementById("status");
  const kitchen = document.getElementById("kitchenList");
  const supply = document.getElementById("supplyList");

  if (status) status.innerHTML = "";
  if (kitchen) kitchen.innerHTML = "";
  if (supply) supply.innerHTML = "";

  let shouldRing = false;

  docs.forEach(doc => {
    const o = doc.data();

    // 🔔 Decide ringing logic
    if (o.ringing) {
      if (
        (kitchen && o.status === "Kitchen") ||
        (supply && o.status === "Supply")
      ) {
        shouldRing = true;
      }
    }

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
        </div>`;
    }

    /******** KITCHEN VIEW ********/
    if (kitchen && o.status === "Kitchen") {

      if (!o.assignedTo) {
        kitchen.innerHTML += `
          <div class="card status-kitchen">
            <h3>Table ${o.table}</h3>
            <p>${o.dish}</p>
            <button class="btn-finish"
              onclick="acceptKitchen('${doc.id}')">
              Accept
            </button>
          </div>`;
      }

      if (o.assignedTo === STAFF_ID) {
        kitchen.innerHTML += `
          <div class="card status-kitchen">
            <h3>Table ${o.table}</h3>
            <p>${o.dish}</p>
            <p><strong>Assigned to you</strong></p>
            <button class="btn-finish"
              onclick="finishOrder('${doc.id}')">
              Finish
            </button>
          </div>`;
      }
    }

    /******** SUPPLY VIEW ********/
    if (supply && o.status === "Supply") {

      if (!o.assignedTo) {
        supply.innerHTML += `
          <div class="card status-supply">
            <h3>Table ${o.table}</h3>
            <p>${o.dish}</p>
            <button class="btn-serve"
              onclick="acceptSupply('${doc.id}')">
              Accept
            </button>
          </div>`;
      }

      if (o.assignedTo === STAFF_ID) {
        supply.innerHTML += `
          <div class="card status-supply">
            <h3>Table ${o.table}</h3>
            <p>${o.dish}</p>
            <p><strong>Assigned to you</strong></p>
            <button class="btn-serve"
              onclick="serve('${doc.id}')">
              Served
            </button>
          </div>`;
      }
    }

  });

  // 🔔 GLOBAL BELL CONTROL
  if (shouldRing) {
    bell.play().catch(() => {});
  } else {
    bell.pause();
    bell.currentTime = 0;
  }

});
