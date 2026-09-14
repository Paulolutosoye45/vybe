// ============================================================================
// NAIJA NIGHT SCHOOL — a five-question daily trivia round, the same for
// everyone, rotating deterministically by date (same pattern as the Daily
// Vybe Challenge: today's round is just a function of today's date, no
// scheduler needed). Five categories per round — music, film, food, cities,
// money habits — matching the brief's own description of the format.
//
// Correct answers are never sent to the client in the GET payload; they're
// only compared server-side on submit. See /api/trivia.
// ============================================================================

export interface TriviaQuestion {
  id: string;
  category: "Music" | "Film" | "Food" | "Cities" | "Money";
  prompt: string;
  options: string[];
  correctIndex: number;
}

// Six full rounds, five questions each — rotates by day-of-year % 6, so a
// round repeats roughly every six days rather than every single day.
const ROUNDS: TriviaQuestion[][] = [
  [
    { id: "r0-music", category: "Music", prompt: "Which genre, born in Lagos, blends jazz, highlife and funk with Yoruba percussion?", options: ["Afrobeat", "Highlife", "Fuji", "Juju"], correctIndex: 0 },
    { id: "r0-film", category: "Film", prompt: "Nigeria's film industry is nicknamed after which two words?", options: ["Lagos Lens", "Nollywood", "Naija Reel", "Africa Frame"], correctIndex: 1 },
    { id: "r0-food", category: "Food", prompt: "Jollof rice is traditionally cooked with rice, tomatoes and which base ingredient?", options: ["Coconut milk", "Pepper and onion stew", "Groundnut paste", "Palm oil only"], correctIndex: 1 },
    { id: "r0-cities", category: "Cities", prompt: "What is the capital city of Nigeria?", options: ["Lagos", "Kano", "Abuja", "Ibadan"], correctIndex: 2 },
    { id: "r0-money", category: "Money", prompt: "Compound interest is calculated on which amount?", options: ["The original deposit only", "The principal plus any interest already earned", "A fixed government rate", "Whatever the bank prefers"], correctIndex: 1 },
  ],
  [
    { id: "r1-music", category: "Music", prompt: "\"Essence\" and \"Last Last\" are songs from which Nigerian artist?", options: ["Wizkid", "Burna Boy", "Rema", "Omah Lay"], correctIndex: 0 },
    { id: "r1-film", category: "Film", prompt: "Which Nigerian city hosts most of Nollywood's production activity?", options: ["Abuja", "Enugu", "Lagos", "Kaduna"], correctIndex: 2 },
    { id: "r1-food", category: "Food", prompt: "Suya is best described as what kind of dish?", options: ["A spiced grilled skewer", "A steamed rice cake", "A cold soup", "A sweet pastry"], correctIndex: 0 },
    { id: "r1-cities", category: "Cities", prompt: "Which Nigerian city is best known as the country's commercial capital?", options: ["Abuja", "Port Harcourt", "Lagos", "Enugu"], correctIndex: 2 },
    { id: "r1-money", category: "Money", prompt: "A \"budget\" is best described as what?", options: ["A plan for expected income and spending", "A type of bank loan", "A government tax form", "An investment account"], correctIndex: 0 },
  ],
  [
    { id: "r2-music", category: "Music", prompt: "Fuji music originated within which Nigerian cultural tradition?", options: ["Igbo", "Yoruba", "Hausa", "Efik"], correctIndex: 1 },
    { id: "r2-film", category: "Film", prompt: "Nollywood is generally ranked among the world's film industries by volume as which of these?", options: ["One of the largest by number of films produced", "A small, niche industry", "Entirely state-funded", "Limited to festival releases only"], correctIndex: 0 },
    { id: "r2-food", category: "Food", prompt: "Which of these is a popular Nigerian swallow, eaten with soup?", options: ["Pounded yam", "Fried plantain", "Meat pie", "Puff-puff"], correctIndex: 0 },
    { id: "r2-cities", category: "Cities", prompt: "Which Nigerian state is home to the ancient city of Ife, a key centre of Yoruba history?", options: ["Osun", "Kano", "Rivers", "Borno"], correctIndex: 0 },
    { id: "r2-money", category: "Money", prompt: "An \"emergency fund\" exists mainly for what purpose?", options: ["Everyday shopping", "Unexpected expenses, so you don't need to borrow", "Paying regular bills", "Buying gifts"], correctIndex: 1 },
  ],
  [
    { id: "r3-music", category: "Music", prompt: "Highlife music, popular across West Africa, is especially associated with which country's coastal cities alongside Nigeria's?", options: ["Ghana", "Kenya", "Morocco", "Senegal"], correctIndex: 0 },
    { id: "r3-film", category: "Film", prompt: "\"The Wedding Party\" is a well-known example of which Nigerian film genre?", options: ["Horror", "Romantic comedy", "War drama", "Documentary"], correctIndex: 1 },
    { id: "r3-food", category: "Food", prompt: "Moin moin is traditionally made from which base ingredient?", options: ["Blended beans", "Ground rice", "Grated cassava", "Mashed plantain"], correctIndex: 0 },
    { id: "r3-cities", category: "Cities", prompt: "Which river is Nigeria's longest, passing through several major cities?", options: ["The Benue", "The Niger", "The Cross River", "The Ogun"], correctIndex: 1 },
    { id: "r3-money", category: "Money", prompt: "What does it typically mean if a purchase is made \"in instalments\"?", options: ["Paid once, in full", "Paid off in smaller amounts over time", "Paid only in cash", "Never actually paid"], correctIndex: 1 },
  ],
  [
    { id: "r4-music", category: "Music", prompt: "Which instrument is central to traditional Fuji and Juju music?", options: ["Talking drum", "Steel guitar", "Trumpet", "Accordion"], correctIndex: 0 },
    { id: "r4-film", category: "Film", prompt: "\"Living in Bondage\" (1992) is widely credited as what for the Nigerian film industry?", options: ["Its first colour television broadcast", "A film that helped launch the modern Nollywood boom", "The first Nigerian film shown abroad", "A government-funded documentary"], correctIndex: 1 },
    { id: "r4-food", category: "Food", prompt: "Egusi soup gets its name and thickness from which ingredient?", options: ["Ground melon seeds", "Crushed groundnuts", "Blended tomatoes", "Ground rice"], correctIndex: 0 },
    { id: "r4-cities", category: "Cities", prompt: "Which Nigerian city is the main hub for the country's oil and gas industry?", options: ["Kano", "Port Harcourt", "Jos", "Ilorin"], correctIndex: 1 },
    { id: "r4-money", category: "Money", prompt: "Diversifying savings across different places mainly helps to do what?", options: ["Guarantee higher returns", "Spread out risk", "Avoid all bank fees", "Increase spending power instantly"], correctIndex: 1 },
  ],
  [
    { id: "r5-music", category: "Music", prompt: "Which Afrobeats artist is known by the nickname \"African Giant\"?", options: ["Davido", "Burna Boy", "Olamide", "Asake"], correctIndex: 1 },
    { id: "r5-film", category: "Film", prompt: "Which of these is a major annual awards event recognising Nigerian and African cinema?", options: ["AMVCA", "The Grammys", "Cannes", "BAFTA"], correctIndex: 0 },
    { id: "r5-food", category: "Food", prompt: "Puff-puff is best described as which kind of snack?", options: ["A fried, doughnut-like ball of dough", "A dried meat strip", "A cold fruit salad", "A savoury rice cake"], correctIndex: 0 },
    { id: "r5-cities", category: "Cities", prompt: "Which Nigerian city is historically known as a major centre for the textile and groundnut trade in the north?", options: ["Kano", "Calabar", "Warri", "Akure"], correctIndex: 0 },
    { id: "r5-money", category: "Money", prompt: "A \"credit score\" is generally used by lenders to judge what?", options: ["How much someone earns", "How likely someone is to repay a loan", "A person's age", "Where someone lives"], correctIndex: 1 },
  ],
];

export function todaysTriviaRound(date = new Date()): TriviaQuestion[] {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return ROUNDS[dayOfYear % ROUNDS.length];
}

// What the client actually receives — no correctIndex, so the answer can't
// be read out of the network tab before playing.
export function publicRound(round: TriviaQuestion[]) {
  return round.map(({ id, category, prompt, options }) => ({ id, category, prompt, options }));
}
