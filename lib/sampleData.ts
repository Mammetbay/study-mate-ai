import * as SQLite from 'expo-sqlite';
import { LanguageCode } from '../config/languages';
import { Flashcard, Note, QuizQuestion } from '../types';
import { insertFlashcards, insertNote, insertQuizQuestions } from './db';
import { initialSRState } from './spacedRepetition';

export async function insertSampleData(
  db: SQLite.SQLiteDatabase,
  language: LanguageCode
): Promise<string> {
  const noteId = `sample-${Date.now()}`;
  const now = new Date().toISOString();

  if (language === 'tr') {
    const sampleNote: Note = {
      id: noteId,
      title: 'Yapay Zeka ve Makine Öğrenmesine Giriş',
      sourceType: 'audio',
      transcript:
        'Bugünkü dersimizde makine öğrenmesinin temel prensiplerini ele alacağız. Makine öğrenimi temelde üç ana dala ayrılır: Denetimli (Supervised), Denetimsiz (Unsupervised) ve Pekiştirmeli (Reinforcement) öğrenme. Denetimli öğrenmede model, etiketlenmiş veriler üzerinden eğitilir; örnek olarak regresyon ve sınıflandırma verilebilir. Denetimsiz öğrenmede ise veri etiketsizdir; model verideki gizli örüntüleri veya kümeleri bulmaya çalışır, k-means kümeleme buna tipik bir örnektir. Pekiştirmeli öğrenmede ise bir ajan, çevreyle etkileşime girerek ödül ve ceza mekanizmasıyla en uygun eylemleri öğrenir. Model başarısını ölçerken eğitim ve test verisini birbirinden ayırmak, aşırı uyumu (overfitting) önlemek için hayati önem taşır.',
      summary:
        '• Makine öğrenimi üç ana paradigmaya ayrılır: Denetimli, Denetimsiz ve Pekiştirmeli öğrenme.\n• Denetimli öğrenme etiketli verilerle çalışır (regresyon ve sınıflandırma).\n• Denetimsiz öğrenme etiketsiz verilerdeki gizli örüntüleri ve kümeleri tespit eder.\n• Pekiştirmeli öğrenme ödül-ceza mekanizmasıyla çevreden öğrenen ajanlara dayanır.\n• Aşırı uyumu (overfitting) engellemek için eğitim ve test veri setlerinin ayrılması zorunludur.',
      createdAt: now,
      language: 'tr',
      tags: ['yapay zeka', 'makine ogrenimi', 'algoritmalar', 'veri bilimi'],
    };

    const sampleQuizzes: QuizQuestion[] = [
      {
        id: `${noteId}-q1`,
        noteId,
        question: 'Denetimli öğrenmenin (Supervised Learning) temel özelliği nedir?',
        options: [
          'Etiketli veri setleri ile eğitilmesi',
          'Ödül-ceza mekanizmasıyla yönlendirilmesi',
          'Verideki kümeleri rastgele oluşturması',
          'Hiçbir parametre güncellemesi yapmaması',
        ],
        correctIndex: 0,
      },
      {
        id: `${noteId}-q2`,
        noteId,
        question: 'K-means algoritması hangi makine öğrenmesi kategorisine girer?',
        options: [
          'Pekiştirmeli Öğrenme',
          'Denetimli Öğrenme',
          'Denetimsiz Öğrenme',
          'Derin Pekiştirmeli Öğrenme',
        ],
        correctIndex: 2,
      },
      {
        id: `${noteId}-q3`,
        noteId,
        question: 'Bir modelin eğitim verisini ezberleyip test verisinde başarısız olmasına ne ad verilir?',
        options: [
          'Underfitting (Yetersiz Uyum)',
          'Overfitting (Aşırı Uyum)',
          'Gradient Descent',
          'Normalizasyon',
        ],
        correctIndex: 1,
      },
      {
        id: `${noteId}-q4`,
        noteId,
        question: 'Ajanın çevre ile etkileşime girerek kümülatif ödülü maksimize ettiği öğrenme türü hangisidir?',
        options: [
          'Denetimsiz Öğrenme',
          'Pekiştirmeli Öğrenme',
          'Doğrusal Regresyon',
          'Karar Ağaçları',
        ],
        correctIndex: 1,
      },
    ];

    const sampleFlashcards: Flashcard[] = [
      {
        id: `${noteId}-fc1`,
        noteId,
        front: 'Denetimli Öğrenme (Supervised Learning)',
        back: 'Girdi ve çıktıları bilinen etiketli verilerle modelin eğitildiği makine öğrenmesi türü.',
        ...initialSRState(),
      },
      {
        id: `${noteId}-fc2`,
        noteId,
        front: 'Denetimsiz Öğrenme (Unsupervised Learning)',
        back: 'Etiketsiz verilerdeki gizli örüntüleri ve doğal gruplamaları keşfetmeyi amaçlayan yöntem.',
        ...initialSRState(),
      },
      {
        id: `${noteId}-fc3`,
        noteId,
        front: 'Pekiştirmeli Öğrenme (Reinforcement Learning)',
        back: 'Ajanın çevreyle etkileşimde bulunarak maksimum ödülü alacak eylemleri öğrendiği paradigma.',
        ...initialSRState(),
      },
      {
        id: `${noteId}-fc4`,
        noteId,
        front: 'Aşırı Uyum (Overfitting)',
        back: 'Modelin eğitim verisini aşırı ezberlemesi ve yeni test verisinde zayıf genelleme yapması.',
        ...initialSRState(),
      },
      {
        id: `${noteId}-fc5`,
        noteId,
        front: 'Sınıflandırma ve Regresyon',
        back: 'Denetimli öğrenmenin en yaygın iki problemi (Kategorik etiketler ve sürekli sayısal değer tahmini).',
        ...initialSRState(),
      },
      {
        id: `${noteId}-fc6`,
        noteId,
        front: 'Kümeleme (Clustering)',
        back: 'Denetimsiz öğrenmede benzer veri noktalarını doğal gruplarda toplayan teknik (örn. K-means).',
        ...initialSRState(),
      },
    ];

    await insertNote(db, sampleNote);
    await insertQuizQuestions(db, sampleQuizzes);
    await insertFlashcards(db, sampleFlashcards);
  } else {
    const sampleNote: Note = {
      id: noteId,
      title: 'Introduction to Machine Learning',
      sourceType: 'audio',
      transcript:
        'In today lecture, we explore the core foundations of machine learning. Machine learning is broadly divided into three paradigms: Supervised, Unsupervised, and Reinforcement learning. In supervised learning, the model is trained on labeled input-output pairs; standard examples include linear regression and classification tasks. In unsupervised learning, data is unlabeled, and algorithms discover hidden patterns or clusters—k-means clustering is a classic example. Reinforcement learning trains autonomous agents to maximize cumulative rewards through trial and error interactions with an environment. Preventing overfitting by evaluating on held-out test data is fundamental to building reliable models.',
      summary:
        '• Machine learning is categorized into Supervised, Unsupervised, and Reinforcement learning.\n• Supervised learning utilizes labeled datasets for classification and regression tasks.\n• Unsupervised learning detects hidden structures and clusters in unlabeled data.\n• Reinforcement learning optimizes agent actions using environmental rewards and penalties.\n• Splitting data into training and test sets is crucial to avoid overfitting.',
      createdAt: now,
      language: 'en',
      tags: ['machine learning', 'ai', 'algorithms', 'data science'],
    };

    const sampleQuizzes: QuizQuestion[] = [
      {
        id: `${noteId}-q1`,
        noteId,
        question: 'What is the key defining feature of Supervised Learning?',
        options: [
          'Training on labeled datasets with target outputs',
          'Relying purely on trial-and-error environment penalties',
          'Using exclusively unlabeled clustering graphs',
          'Never adjusting model weights during execution',
        ],
        correctIndex: 0,
      },
      {
        id: `${noteId}-q2`,
        noteId,
        question: 'Which machine learning category does K-means clustering belong to?',
        options: [
          'Reinforcement Learning',
          'Supervised Learning',
          'Unsupervised Learning',
          'Deep Reinforcement Learning',
        ],
        correctIndex: 2,
      },
      {
        id: `${noteId}-q3`,
        noteId,
        question: 'What term describes a model that memorizes training data but fails to generalize to test data?',
        options: [
          'Underfitting',
          'Overfitting',
          'Gradient Descent',
          'Feature Normalization',
        ],
        correctIndex: 1,
      },
      {
        id: `${noteId}-q4`,
        noteId,
        question: 'Which learning paradigm involves an agent interacting with an environment to maximize cumulative rewards?',
        options: [
          'Unsupervised Learning',
          'Reinforcement Learning',
          'Linear Regression',
          'Decision Trees',
        ],
        correctIndex: 1,
      },
    ];

    const sampleFlashcards: Flashcard[] = [
      {
        id: `${noteId}-fc1`,
        noteId,
        front: 'Supervised Learning',
        back: 'Training a model on labeled data where inputs are paired with known ground-truth targets.',
        ...initialSRState(),
      },
      {
        id: `${noteId}-fc2`,
        noteId,
        front: 'Unsupervised Learning',
        back: 'Algorithms that uncover hidden patterns, groupings, or structures in unlabeled datasets.',
        ...initialSRState(),
      },
      {
        id: `${noteId}-fc3`,
        noteId,
        front: 'Reinforcement Learning',
        back: 'A goal-oriented paradigm where an agent learns optimal actions via environmental rewards and penalties.',
        ...initialSRState(),
      },
      {
        id: `${noteId}-fc4`,
        noteId,
        front: 'Overfitting',
        back: 'When a model learns noise and details from training data so closely that it performs poorly on new test data.',
        ...initialSRState(),
      },
      {
        id: `${noteId}-fc5`,
        noteId,
        front: 'Classification vs Regression',
        back: 'The two primary supervised tasks: predicting discrete categories vs predicting continuous numeric values.',
        ...initialSRState(),
      },
      {
        id: `${noteId}-fc6`,
        noteId,
        front: 'Clustering',
        back: 'An unsupervised technique grouping similar data points together based on distance metrics (e.g. K-means).',
        ...initialSRState(),
      },
    ];

    await insertNote(db, sampleNote);
    await insertQuizQuestions(db, sampleQuizzes);
    await insertFlashcards(db, sampleFlashcards);
  }

  return noteId;
}
