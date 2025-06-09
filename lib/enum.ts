// lib/enums.ts (or add to an existing utils file)
import {  shelf_type, status_type  } from '@prisma/client';

export function parseShelfType(shelf: string): shelf_type {
  switch (shelf.toLowerCase()) {
    case 'favorite':
      return shelf_type.favorite;
    case 'currently_reading':
      return shelf_type.currently_reading;
    case 'queue':
      return shelf_type.queue;
    default:
      throw new Error(`Invalid shelf type provided: ${shelf}`);
  }
}

export function parseStatusType(status: string): status_type {
  switch (status.toLowerCase()) {
    case 'in_progress':
      return status_type.in_progress;
    case 'almost_done':
      return status_type.almost_done;
    case 'finished':
      return status_type.finished;
    case 'unfinished':
      return status_type.unfinished;
    default:
      throw new Error(`Invalid status type provided: ${status}`);
  }
}