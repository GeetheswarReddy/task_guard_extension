document.getElementById('submit_intent').addEventListener('click', getIntent);
function getIntent(){
let intent=document.getElementById('intent_input');
let taskDescription=document.getElementById('task_description');
console.log("Intent: ", intent.value);
console.log("Task Description: ", taskDescription.value);
window.location.href = "allowlist.html";
}