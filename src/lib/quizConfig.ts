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
    options: ["Athens", "Nicosia", "Valletta", "Istanbul", "Rome"],
  },
  {
    id: 2,
    imageUrl: "/images/cafe_2.png",
    correctCity: "New York City",
    options: ["Bogotá", "Seattle", "London", "Melbourne", "New York City"],
  },
  {
    id: 3,
    imageUrl: "/images/cafe_3.png",
    correctCity: "Bucharest",
    options: ["Paris", "Brussels", "Bucharest", "Berlin", "Budapest"],
  },
  {
    id: 4,
    imageUrl: "/images/cafe_4.png",
    correctCity: "Guangzhou",
    options: ["Tokyo", "Taipei", "Bangkok", "Seoul", "Guangzhou"],
  },
];
