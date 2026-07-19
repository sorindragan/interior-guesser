export interface Question {
  id: number;
  imageUrl: string;
  correctCity: string;
  options: string[];
}

export const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    imageUrl: "/images/cafe_1.jpeg",
    correctCity: "Nicosia",
    options: ["Nicosia", "Athens", "Valletta", "Istanbul", "Rome"],
  },
  {
    id: 2,
    imageUrl: "/images/cafe_2.png",
    correctCity: "New York City",
    options: ["New York City", "Bogotá", "Seattle", "London", "Melbourne"],
  },
  {
    id: 3,
    imageUrl: "/images/cafe_3.png",
    correctCity: "Bucharest",
    options: ["Bucharest", "Paris", "Berlin", "Brussels", "Budapest"],
  },
  {
    id: 4,
    imageUrl: "/images/cafe_4.png",
    correctCity: "Guangzhou",
    options: ["Guangzhou", "Tokyo", "Seoul", "Taipei", "Bangkok"],
  },
];
