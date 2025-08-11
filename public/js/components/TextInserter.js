/**
 * TextInserter.js
 * Utility functions for inserting text at cursor position or replacing selected text
 */

/**
 * Insert text at the cursor position or replace selected text in a textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @param {string} text - The text to insert
 * @returns {boolean} - True if successful, false otherwise
 */
export function insertTextAtCursor(textarea, text) {
    if (!textarea) {
        console.error('No textarea provided to insertTextAtCursor');
        return false;
    }

    // Save the current scroll position
    const scrollPos = textarea.scrollTop;
    
    // Get the current selection or cursor position
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const currentValue = textarea.value;
    
    // Insert text at cursor position or replace selected text
    if (selectionStart !== selectionEnd) {
        // Replace selected text with new text
        textarea.value = currentValue.substring(0, selectionStart) + 
                         text + 
                         currentValue.substring(selectionEnd);
        
        // Set selection to after the inserted text
        textarea.setSelectionRange(selectionStart + text.length, selectionStart + text.length);
    } else {
        // Insert at cursor position
        textarea.value = currentValue.substring(0, selectionStart) + 
                         text + 
                         currentValue.substring(selectionStart);
        
        // Set cursor position after the inserted text
        textarea.setSelectionRange(selectionStart + text.length, selectionStart + text.length);
    }
    
    // Restore scroll position
    textarea.scrollTop = scrollPos;
    
    // Focus the textarea
    textarea.focus();
    
    // Trigger input event to update any listeners
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
    
    return true;
}

/**
 * Replace all occurrences of a string in a textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @param {string|RegExp} searchValue - The string or regex to search for
 * @param {string} replaceValue - The string to replace with
 * @returns {boolean} - True if any replacements were made, false otherwise
 */
export function replaceTextInTextarea(textarea, searchValue, replaceValue) {
    if (!textarea) {
        console.error('No textarea provided to replaceTextInTextarea');
        return false;
    }
    
    const originalValue = textarea.value;
    const newValue = originalValue.replace(searchValue, replaceValue);
    
    // Only update if changes were made
    if (newValue !== originalValue) {
        textarea.value = newValue;
        
        // Trigger input event to update any listeners
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
        
        return true;
    }
    
    return false;
}

/**
 * Find and replace the first occurrence of text after the cursor position
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @param {string|RegExp} searchValue - The string or regex to search for
 * @param {string} replaceValue - The string to replace with
 * @returns {boolean} - True if a replacement was made, false otherwise
 */
export function replaceNextOccurrence(textarea, searchValue, replaceValue) {
    if (!textarea) {
        console.error('No textarea provided to replaceNextOccurrence');
        return false;
    }
    
    const cursorPos = textarea.selectionStart;
    const textAfterCursor = textarea.value.substring(cursorPos);
    
    // Check if there's a match after the cursor
    const match = textAfterCursor.match(searchValue);
    if (!match) return false;
    
    // Calculate the position of the match
    const matchPos = cursorPos + match.index;
    const matchLength = match[0].length;
    
    // Replace the text
    textarea.value = 
        textarea.value.substring(0, matchPos) + 
        replaceValue + 
        textarea.value.substring(matchPos + matchLength);
    
    // Set selection to after the replaced text
    textarea.setSelectionRange(matchPos + replaceValue.length, matchPos + replaceValue.length);
    
    // Focus the textarea
    textarea.focus();
    
    // Trigger input event to update any listeners
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
    
    return true;
}
