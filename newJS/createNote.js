//depends on ../javascript/main.js
//depends on ../javascript/batch_home.js

const noteTextArea = document.getElementById('note_text');
const submitNoteBtn = document.getElementById('submit_new_note_btn');
const closeNoteModal = document.getElementById('close_note_modal_btn');
const modalAlert = document.getElementById('modal_alert');
const modalContainer = document.querySelector('.modal.fade');

let notes;  
let targetNote;

const Note = function(id, batchId, associateId, weekNumber, cont){
    return {
        id: id,
        batchId: batchId,
        associateId: associateId,
        weekNumber: weekNumber,
        cont: cont
    };
}

const getAllNotes = async function(){
    const url = `${base_url}notes`;   
    const method = 'GET';
    const cbFunction = function(...params){
        notes = JSON.parse(params[1]);
    }
    await ajaxCaller(method, url, cbFunction);
}

const createNote = async function(note){
    const method = 'POST';
    const url = `${base_url}notes`;
    cbFunction = (...params) => {}
    await ajaxCaller(method, url, cbFunction, null, null, note);
}

const updateNote = async function(note){
    const method = 'PUT';
    const url = `${base_url}notes/${note.id}`;
    cbFunction = (...params) => {}
    await ajaxCaller(method, url, cbFunction, null, null, note);
}

const findStudentNoteForWeek = function(week, batchId, associateId){
    if(!notes) return;
    return notes.filter(
        note => note.weekNumber === week && note.batchId === batchId && note.associateId === associateId
    );
}

const updateNoteModalText = function(){
    if(!targetNote.id){
        submitNoteBtn.innerHTML = 'Create';
        return;
    }
    noteTextArea.value = targetNote.cont;
    submitNoteBtn.innerHTML = 'Update';
}

const resetNoteModal = function(text){
    noteTextArea.value = '';
    removeWarningAndEnableBtn();
}

const removeWarningAndEnableBtn = function(){
    if(modalAlert.classList.contains('active')) toggleNoteModalAlert();
    if(submitNoteBtn.disabled === true) submitNoteBtn.disabled = null;
}

const openModal = async function(e){
    if(e.target.classList.contains('toggle_create_note_modal_btn')){
        //1) get all notes if not already cached
        await getAllNotes();

        //2) find event target's specific note or create a new target note
        const associateId = parseInt(e.target.dataset.id);
        const curNote = findStudentNoteForWeek(curWeek, batch.id, associateId)[0];
        if(curNote) targetNote = curNote;
        else targetNote = Note(0, batch.id, associateId, curWeek, null);
        
        //3) prepare modal to UI
        resetNoteModal();
        updateNoteModalText();
    }
}

const toggleNoteModalAlert = function(){
    modalAlert.classList.toggle('hidden');
    modalAlert.classList.toggle('active');
}

const submitNote = async function(e){
    try{e.pr
        if(!noteTextArea.value) throw new Error("Message text cannot be null.");
        submitNoteBtn.disabled = true;
        if(!targetNote.id){
            //1) POST
            targetNote.cont = noteTextArea.value;
            //await createNote(targetNote);
        }else{
            //2) ...or PUT
            targetNote.cont = noteTextArea.value;
            //await updateNote(targetNote);
        }
        //update UI
        resetNoteModal();
        modalContainer.style.display = 'none';
        modalContainer.classList.remove('show');
    }catch(err){
        submitNoteBtn.disabled = true;
        toggleNoteModalAlert();
    }
}

noteTextArea.addEventListener('input', removeWarningAndEnableBtn);
submitNoteBtn.addEventListener('click', submitNote);
closeNoteModal.addEventListener('click', resetNoteModal);
window.addEventListener('click', openModal);