// Erreurs attendues de l'API (docs/05-api.md § 1.5, docs/08-conventions-qualite.md § 5).
// Le message est en français, compréhensible, sans détail technique : il est montré à l'utilisateur.

export type CodeErreur =
  'PARAMETRE_INVALIDE' | 'INTROUVABLE' | 'SERVICE_EXTERNE_INDISPONIBLE' | 'ERREUR_INTERNE';

export class ErreurApi extends Error {
  constructor(
    readonly code: CodeErreur,
    readonly statut: number,
    message: string,
    readonly reessayable = false,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ParametreInvalide extends ErreurApi {
  constructor(message: string) {
    super('PARAMETRE_INVALIDE', 400, message);
  }
}

export class Introuvable extends ErreurApi {
  constructor(message: string) {
    super('INTROUVABLE', 404, message);
  }
}

export class ServiceExterneIndisponible extends ErreurApi {
  constructor(message: string) {
    super('SERVICE_EXTERNE_INDISPONIBLE', 503, message, true);
  }
}
