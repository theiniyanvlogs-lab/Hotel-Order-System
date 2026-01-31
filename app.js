/***********************
 🔔 Bell Sound (loop)
************************/
const bell = new Audio("bell.mp3");
bell.loop = true;

// 🔊 sound state per phone
let soundEnabled = localStorage.getItem("soundEnabled") === "true";

/***********************
 📳 VIBRATION UTILITY
************************/
function vibrateAlert() {
  if (navigator.vibrate) {
    navigator.vibrate([500, 300, 500, 300, 500]);
  }
}

/***********************
 🔊 ENABLE SOUND BUTTON
************************/
function enableSoundClick() {
  bell.play()
    .then(() => {
      bell.pause();
      bell.currentTime = 0;

      soundEnabled = true;
      localStorage.setItem("soundEnabled", "true");

      const btn = document.getElementById("enableSound");
      if (btn) {
        btn.classList.remove("sound-off");
        btn.classList.add("sound-on");
        btn.innerText = "🔊 Sound Enabled";
      }
    })
    .catch(() => {
      alert("Tap again to enable sound");
    });
}

// Restore green state
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("enableSound");
  if (btn && soundEnabled) {
    btn.classList.remove("sound-off");
    btn.classList.add("sound-on");
    btn.innerText = "🔊 Sound Enabled";
  }
});

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
    ringing: true,
    time: Date.now()
  });

  document.getElementById("dish").value = "";
}

/***********************
 👨‍🍳 KITCHEN
************************/
function acceptKitchen(id) {
  ordersRef.doc(id).update({
    assignedTo: STAFF_ID,
    ringing: false
  });
}

function finishOrder(id) {
  ordersRef.doc(id).update({
    status: "Supply",
    assignedTo: null,
    ringing: true
  });
}

/***********************
 🚶 SUPPLY
************************/
function acceptSupply(id) {
  ordersRef.doc(id).update({
    assignedTo: STAFF_ID,
    ringing: false
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
 🔥 ALL CLEAR (MANAGER)
************************/
function allClear() {
  const pwd = prompt("Enter manager password");

  if (pwd !== "1854") {
    alert("❌ Wrong password");
    return;
  }

  const ok = confirm(
    "⚠️ Are you sure?\nThis will DELETE ALL orders permanently!"
  );

  if (!ok) return;

  ordersRef.get().then(snapshot => {
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
  }).then(() => {
    alert("✅ All orders cleared");
  }).catch(err => {
    alert("❌ Error while clearing");
    console.error(err);
  });
}

/***********************
 🔄 REAL-TIME LISTENER
************************/
ordersRef.orderBy("time").onSnapshot(snapshot => {

  const status = document.getElementById("status");
  const kitchen = document.getElementById("kitchenList");
  const supply = document.getElementById("supplyList");

  if (status) status.innerHTML = "";
  if (kitchen) kitchen.innerHTML = "";
  if (supply) supply.innerHTML = "";

  let shouldRing = false;

  snapshot.docs.forEach(doc => {
    const o = doc.data();

    if (
      o.ringing &&
      (
        (kitchen && o.status === "Kitchen") ||
        (supply && o.status === "Supply")
      )
    ) {
      shouldRing = true;
    }

    /******** ORDER TAKER ********/
    if (status) {
      const cls =
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

    /******** KITCHEN ********/
    if (kitchen && o.status === "Kitchen") {
      kitchen.innerHTML += `
        <div class="card status-kitchen">
          <h3>Table ${o.table}</h3>
          <p>${o.dish}</p>
          ${
            !o.assignedTo
              ? `<button class="btn-finish" onclick="acceptKitchen('${doc.id}')">Accept</button>`
              : o.assignedTo === STAFF_ID
                ? `<p><strong>Assigned to you</strong></p>
                   <button class="btn-finish" onclick="finishOrder('${doc.id}')">Finish</button>`
                : `<p><em>Assigned to ${o.assignedTo}</em></p>`
          }
        </div>`;
    }

    /******** SUPPLY ********/
    if (supply && o.status === "Supply") {
      supply.innerHTML += `
        <div class="card status-supply">
          <h3>Table ${o.table}</h3>
          <p>${o.dish}</p>
          ${
            !o.assignedTo
              ? `<button class="btn-serve" onclick="acceptSupply('${doc.id}')">Accept</button>`
              : o.assignedTo === STAFF_ID
                ? `<p><strong>Assigned to you</strong></p>
                   <button class="btn-serve" onclick="serve('${doc.id}')">Served</button>`
                : `<p><em>Assigned to ${o.assignedTo}</em></p>`
          }
        </div>`;
    }
  });

  /***********************
   🔔 ALERT CONTROL
  ************************/
  if (shouldRing) {
    if (soundEnabled) bell.play().catch(() => {});
    vibrateAlert();
  } else {
    bell.pause();
    bell.currentTime = 0;
  }
});
