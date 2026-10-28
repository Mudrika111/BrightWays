const activities = {
  bw_done_adhd_memory: { type: "adhd", title: "Memory Match" },
  bw_done_adhd_recall: { type: "adhd", title: "Quick Recall" },
  bw_done_adhd_spot: { type: "adhd", title: "Spot the Diff" },
  bw_done_adhd_number: { type: "adhd", title: "Number Dash" },
  bw_done_dyslexia_phonics: { type: "dyslexia", title: "Phonics Play" },
  bw_done_dyslexia_word: { type: "dyslexia", title: "Word Match" },
  bw_done_dyslexia_rhyme: { type: "dyslexia", title: "Rhyme Time" },
  bw_done_dyslexia_letters: { type: "dyslexia", title: "Letter Sounds" },
  bw_done_autism_routine: { type: "autism", title: "My Routine" },
  bw_done_autism_feelings: { type: "autism", title: "Feelings" },
  bw_done_autism_story: { type: "autism", title: "Story Time" },
  bw_done_autism_sort: { type: "autism", title: "Sort & Match" }
};

function getActivity(key) {
  return typeof key === "string" &&
    Object.prototype.hasOwnProperty.call(activities, key)
    ? activities[key]
    : null;
}

module.exports = { activities, getActivity };
