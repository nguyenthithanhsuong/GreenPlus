import { AppError } from "../../../core/errors";

const NOTE_PROHIBITED_REGEX = /[<>$`]/;

export interface CartNoteValidationStrategy {
  validate(note: string): void;
}

class DefaultCartNoteValidationStrategy implements CartNoteValidationStrategy {
  validate(note: string): void {
    if (note.length > 255) {
      throw new AppError("Note must not exceed 255 characters", 400);
    }

    if (NOTE_PROHIBITED_REGEX.test(note)) {
      throw new AppError("Note contains prohibited characters", 400);
    }
  }
}

export function createCartNoteValidationStrategy(): CartNoteValidationStrategy {
  return new DefaultCartNoteValidationStrategy();
}
