import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createNewMember = async (data: any) => {
  const member = await prisma.member.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      work: data.work,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender,
      avatarUrl: data.avatarUrl || null,
      keyFob: data.keyFob,
      tags: data.tags,
      note: data.note,
      memberType: data.memberType,

      street: data.address?.street,
      city: data.address?.city,
      state: data.address?.state,
      zip: data.address?.zip,
      addressSearch: data.address?.search,

      salesRep: data.marketing?.salesRep,
      sourcePromotion: data.marketing?.sourcePromotion,
      referredBy: data.marketing?.referredBy,

      trainer: data.additional?.trainer,
      joiningDate: data.additional?.joiningDate ? new Date(data.additional.joiningDate) : null,
      occupation: data.additional?.occupation,
      organization: data.additional?.organization,
      involvementType: data.additional?.involvementType,

      emergencyName: data.emergency?.name,
      emergencyRelationship: data.emergency?.relationship,
      emergencyPhone: data.emergency?.phone,
      emergencyEmail: data.emergency?.email,

      medicalInfo: data.medicalInfo,
      clubId: data.club, // Assuming club name maps to an existing clubId, otherwise adjust
    },
  });

  return member;
};
