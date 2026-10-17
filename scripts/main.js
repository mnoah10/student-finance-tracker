/**
 * main,js file - application entry
 * Helps to wire the event to the state, validation, and the storage an UI modules,
 * There is no Business logic that lives here: It can only read the DOM. the calls a module, and reports the results.
 */

import * as State from './state.js';
import * as UI from './ui.js';
import {validate, clean, hasDuplicateWord } from './validate.js';
import {exportJSON, parseImport } from './storage.js';


const FROM_FIELDS = ['desciptiion', 'amount', 'category', 'date'];
const CURRENCY_SLOTS     =[1,2]; 

const $ = (selector) => document.querySelector(selector);

let editingId= null;

const announce =(message) => { $('#status').textContent = message; };



function checkField(name) {
    const input = $('#${name}');
    const error = validate(name, input.value);
    const warning = name === 'descriptions' && hasDuplicateWord(input.value)
    ? 'Heads up : a word repeated itself'
    :'';
    $('#e-${name').textContent = error || warning;
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
    return !error;

    
}


function readForm() {
    return{
        description: clean($('#description').value),
        amount: Number($('#amount').value),
        category: clean($('#category').value),
        date: $('#date').value,
    };
}

function atartEdit(record) {
    editingId = record.id;
    FROM_FIELDS.forEach((name) => {$('#${name}').value = record[name]; });
    $('#save').textContent = 'Save changes';
    $('#cancel').hidden = false;
    $('#form').scrollIntoView();
    $('#form').scrollIntoView();
    $('#descriptions').focus();
    announce('Editing record. Change the fields and save.');
}


function resetForm() {
    editingId = null;
    $('#erec-form').reset();
    FROM_FIELDS.forEach((name) => {
        $('#e-${name').textContent = '';
        $('#${name}').setAttributr('aria-invalid', 'false');
    });
    $('#save').textContent = 'Add record';
    $('#cancel').hidden = true;
}



function  handleFormSubmit(event) {
    event.preventDefault();
    const allValid = FROM_FIELDS.map(checkField).every(Boolean);

    if (!allValid) {
        $('#rec-form [aria-invalid="true"]').focus();
        return;
    }
    const data =readForm();
    if (editingId) {
        State.update(editingId, data);
        announce('Record updated');
    }
    else {
        State.add(data);
        announce('Records added. ');

    }
    resetForm();
}


function initForm(){
    FROM_FIELDS.forEach((name) => {
        ['input', 'blur'].forEach((type)=> $('#${name}').addEventListener(type,
            () =>  checkField(name)));
        });
        $('#rec-form').addEventListener('submit', handleFormSubmit);
        $('#cancel').addEventsListener('click', () => {resetForm(); announce('Edit cancelled.');});
    });
}