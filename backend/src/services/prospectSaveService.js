/**
 * Service de sauvegarde et d'enrichissement des prospects
 * Extrait la logique métier hors du controller pour meilleure modularité
 * @module prospectSaveService
 */

import { Prospect, Tag, SourceScraping } from '../models/index.js';
import { Op } from 'sequelize';
import { addressesMatch } from '../utils/addressNormalizer.js';

/**
 * Service de gestion de la sauvegarde des prospects
 */
class ProspectSaveService {
  /**
   * Sauvegarde une liste de prospects avec gestion des doublons et enrichissement
   *
   * @param {Array<Object>} prospects - Liste des prospects à sauvegarder
   * @param {string} keyword - Mot-clé de recherche (utilisé pour créer un tag)
   * @param {string} sourceName - Nom de la source de scraping
   * @returns {Promise<Array<Prospect>>} Liste des prospects sauvegardés ou enrichis
   *
   * @example
   * const service = new ProspectSaveService();
   * const saved = await service.saveProspects(prospects, 'plombier', 'Google Maps');
   */
  async saveProspects(prospects, keyword, sourceName) {
    const savedProspects = [];

    // Récupérer ou créer le tag et la source une seule fois
    const tag = await this._getOrCreateTag(keyword);
    const source = await this._getOrCreateSource(sourceName);

    console.log(`[ProspectSaveService] 📌 Source utilisée: ${source.nom} (ID: ${source.id})`);

    // Traiter chaque prospect
    for (const prospectData of prospects) {
      try {
        const savedProspect = await this._processProspect(prospectData, tag, source);
        savedProspects.push(savedProspect);
      } catch (error) {
        console.error(
          `[ProspectSaveService] ❌ Erreur sauvegarde prospect "${prospectData.nom_entreprise}":`,
          error.message
        );
      }
    }

    console.log(
      `[ProspectSaveService] ✅ Sauvegarde terminée: ${savedProspects.length}/${prospects.length} prospects`
    );

    return savedProspects;
  }

  /**
   * Traite un prospect individuel (création ou enrichissement)
   * @private
   */
  async _processProspect(prospectData, tag, source) {
    // Vérifier si le prospect existe déjà
    const existingProspect = await this._findDuplicate(prospectData);

    if (existingProspect) {
      return await this._enrichExistingProspect(existingProspect, prospectData, tag, source);
    } else {
      return await this._createNewProspect(prospectData, tag, source);
    }
  }

  /**
   * Récupère ou crée un tag basé sur le keyword
   * @private
   */
  async _getOrCreateTag(keyword) {
    const tagName = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    const [tag] = await Tag.findOrCreate({
      where: { nom: tagName },
    });
    return tag;
  }

  /**
   * Récupère ou crée une source de scraping
   * @private
   */
  async _getOrCreateSource(sourceName) {
    const [source] = await SourceScraping.findOrCreate({
      where: { nom: sourceName },
      defaults: {
        description: `Source de scraping: ${sourceName}`,
        actif: true,
      },
    });
    return source;
  }

  /**
   * Recherche un prospect en doublon selon plusieurs critères
   *
   * Critères de détection (dans l'ordre) :
   * 1. Email identique
   * 2. URL de site identique
   * 3. Nom + coordonnées GPS identiques
   * 4. Nom + adresse normalisée similaire
   *
   * @private
   * @param {Object} prospectData - Données du prospect à vérifier
   * @returns {Promise<Prospect|null>} Prospect existant ou null
   */
  async _findDuplicate(prospectData) {
    // Étape 1 : Vérifier les doublons exacts (email, URL, GPS)
    let existingProspect = await this._findExactDuplicate(prospectData);

    // Étape 2 : Si pas trouvé, vérifier par nom + adresse normalisée
    if (!existingProspect && prospectData.nom_entreprise && prospectData.adresse) {
      existingProspect = await this._findDuplicateByAddress(prospectData);
    }

    return existingProspect;
  }

  /**
   * Recherche un doublon exact (email, URL, nom+GPS)
   * @private
   */
  async _findExactDuplicate(prospectData) {
    const conditions = [
      // Même email
      prospectData.email ? { email: prospectData.email } : null,
      // Même URL
      prospectData.url_site ? { url_site: prospectData.url_site } : null,
      // Même nom ET mêmes coordonnées GPS
      prospectData.nom_entreprise && prospectData.latitude && prospectData.longitude
        ? {
            nom_entreprise: prospectData.nom_entreprise,
            latitude: prospectData.latitude,
            longitude: prospectData.longitude,
          }
        : null,
    ].filter(Boolean);

    if (conditions.length === 0) {
      return null;
    }

    return await Prospect.findOne({
      where: { [Op.or]: conditions },
      include: [
        { model: Tag, as: 'tags' },
        { model: SourceScraping, as: 'sources' },
      ],
    });
  }

  /**
   * Recherche un doublon par nom + adresse normalisée
   * @private
   */
  async _findDuplicateByAddress(prospectData) {
    // Trouver tous les prospects avec le même nom
    const potentialDuplicates = await Prospect.findAll({
      where: { nom_entreprise: prospectData.nom_entreprise },
      include: [
        { model: Tag, as: 'tags' },
        { model: SourceScraping, as: 'sources' },
      ],
    });

    // Comparer les adresses normalisées
    for (const candidate of potentialDuplicates) {
      if (candidate.adresse && addressesMatch(prospectData.adresse, candidate.adresse)) {
        console.log(`[ProspectSaveService] 🔍 Doublon détecté via normalisation d'adresse:`);
        console.log(`   - Base: "${candidate.adresse}"`);
        console.log(`   - Nouveau: "${prospectData.adresse}"`);
        return candidate;
      }
    }

    return null;
  }

  /**
   * Enrichit un prospect existant avec de nouvelles données
   *
   * Stratégie d'enrichissement :
   * - Champs stables (adresse, GPS, ville, CP) : enrichir uniquement si null/vide
   * - Champs changeants (contact, email, téléphone, URL, note) : toujours mettre à jour si différents
   *
   * @private
   * @param {Prospect} existingProspect - Prospect existant
   * @param {Object} prospectData - Nouvelles données
   * @param {Tag} tag - Tag à associer
   * @param {SourceScraping} source - Source à associer
   * @returns {Promise<Prospect>} Prospect enrichi
   */
  async _enrichExistingProspect(existingProspect, prospectData, tag, source) {
    console.log(
      `[ProspectSaveService] ⚠️  Doublon détecté: ${prospectData.nom_entreprise} (${prospectData.adresse || "pas d'adresse"})`
    );

    // Ajouter la source si pas déjà présente
    await this._addSourceIfMissing(existingProspect, source);

    // Enrichir les données
    const hasUpdates = await this._enrichProspectData(existingProspect, prospectData);

    // Ajouter le tag si pas déjà présent
    await this._addTagIfMissing(existingProspect, tag);

    // Recharger avec les relations pour le retour
    await existingProspect.reload({
      include: [
        { model: Tag, as: 'tags' },
        { model: SourceScraping, as: 'sources' },
      ],
    });

    return existingProspect;
  }

  /**
   * Ajoute une source au prospect si elle n'est pas déjà associée
   * @private
   */
  async _addSourceIfMissing(prospect, source) {
    const hasSource = prospect.sources.some((s) => s.id === source.id);

    if (!hasSource) {
      await prospect.addSource(source);
      console.log(`[ProspectSaveService] ✅ Source "${source.nom}" ajoutée au prospect existant`);
    } else {
      console.log(`[ProspectSaveService] ℹ️  Source "${source.nom}" déjà associée à ce prospect`);
    }
  }

  /**
   * Ajoute un tag au prospect si il n'est pas déjà associé
   * @private
   */
  async _addTagIfMissing(prospect, tag) {
    const hasTag = prospect.tags.some((t) => t.id === tag.id);

    if (!hasTag) {
      await prospect.addTag(tag);
      console.log(`[ProspectSaveService] ✅ Tag "${tag.nom}" ajouté au prospect existant`);
    }
  }

  /**
   * Enrichit les données d'un prospect existant
   *
   * @private
   * @param {Prospect} prospect - Prospect à enrichir
   * @param {Object} newData - Nouvelles données
   * @returns {Promise<boolean>} true si des mises à jour ont été effectuées
   */
  async _enrichProspectData(prospect, newData) {
    const updatedFields = {};

    // Champs à enrichir uniquement si null/vide (données stables)
    const stableFields = ['adresse', 'latitude', 'longitude', 'ville', 'code_postal'];

    // Champs à toujours mettre à jour si différents (données qui peuvent changer)
    const changeableFields = ['nom_contact', 'email', 'telephone', 'telephone_2', 'telephone_3', 'url_site', 'note'];

    // 1. Enrichir les champs stables (uniquement si vides)
    this._enrichStableFields(prospect, newData, stableFields, updatedFields);

    // 2. Mettre à jour les champs changeants (si différents)
    this._updateChangeableFields(prospect, newData, changeableFields, updatedFields);

    // Appliquer les mises à jour si nécessaire
    if (Object.keys(updatedFields).length > 0) {
      await prospect.update(updatedFields);
      console.log(
        `[ProspectSaveService] ✅ Données enrichies: ${Object.keys(updatedFields).join(', ')}`
      );
      return true;
    } else {
      console.log(`[ProspectSaveService] ℹ️  Aucune nouvelle donnée à enrichir`);
      return false;
    }
  }

  /**
   * Enrichit les champs stables (uniquement si null/vide)
   * @private
   */
  _enrichStableFields(prospect, newData, fields, updatedFields) {
    fields.forEach((field) => {
      const existingValue = prospect[field];
      const newValue = newData[field];

      const isEmpty = existingValue === null || existingValue === undefined || existingValue === '';
      const hasNewValue = newValue !== null && newValue !== undefined && newValue !== '';

      if (isEmpty && hasNewValue) {
        updatedFields[field] = newValue;
      }
    });
  }

  /**
   * Met à jour les champs changeants (si différents et non vides)
   * @private
   */
  _updateChangeableFields(prospect, newData, fields, updatedFields) {
    fields.forEach((field) => {
      const existingValue = prospect[field];
      const newValue = newData[field];

      const hasNewValue = newValue !== null && newValue !== undefined && newValue !== '';
      const isDifferent = existingValue !== newValue;

      if (hasNewValue && isDifferent) {
        updatedFields[field] = newValue;
        console.log(
          `[ProspectSaveService] 🔄 Mise à jour de ${field}: "${existingValue}" → "${newValue}"`
        );
      }
    });
  }

  /**
   * Crée un nouveau prospect
   *
   * @private
   * @param {Object} prospectData - Données du prospect
   * @param {Tag} tag - Tag à associer
   * @param {SourceScraping} source - Source à associer
   * @returns {Promise<Prospect>} Nouveau prospect créé
   */
  async _createNewProspect(prospectData, tag, source) {
    // Créer le nouveau prospect
    const prospect = await Prospect.create({
      nom_entreprise: prospectData.nom_entreprise,
      nom_contact: prospectData.nom_contact || null,
      email: prospectData.email || null,
      telephone: prospectData.telephone || null,
      telephone_2: prospectData.telephone_2 || null,
      telephone_3: prospectData.telephone_3 || null,
      adresse: prospectData.adresse || null,
      url_site: prospectData.url_site || null,
      latitude: prospectData.latitude || null,
      longitude: prospectData.longitude || null,
      note: prospectData.note || null,
      ville: prospectData.ville || null,
      code_postal: prospectData.code_postal || null,
    });

    // Associer la source de scraping
    await prospect.addSource(source);
    console.log(`[ProspectSaveService] ✅ Source "${source.nom}" associée au nouveau prospect`);

    // Associer le tag
    await prospect.addTag(tag);

    // Recharger avec les relations pour le retour
    await prospect.reload({
      include: [
        { model: Tag, as: 'tags' },
        { model: SourceScraping, as: 'sources' },
      ],
    });

    console.log(`[ProspectSaveService] ✅ Nouveau prospect sauvegardé: ${prospect.nom_entreprise}`);

    return prospect;
  }
}

// Export singleton
const prospectSaveService = new ProspectSaveService();
export default prospectSaveService;
