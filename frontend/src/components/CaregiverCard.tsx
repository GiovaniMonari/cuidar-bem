'use client';

import Link from 'next/link';
import { Caregiver, SPECIALTIES } from '@/types';
import { StarRating } from './StarRating';
import { UserAvatar } from './UserAvatar';
import { MapPin, Clock, Award, ChevronRight, Heart } from 'lucide-react';

interface Props {
  caregiver: any;
  isFavorited: boolean;
  onToggleFavorite: (caregiverId: string) => void;
}

export function CaregiverCard({ caregiver, isFavorited, onToggleFavorite }: Props) {
  // Proteção contra null/undefined
  if (!caregiver || !caregiver._id) {
    return null;
  }

  const user = caregiver?.userId || caregiver?.user || caregiver;
  const rating = Number(caregiver?.rating) || 0;
  const reviewCount = Number(caregiver?.reviewCount) || 0;
  const bio = caregiver?.bio || 'Sem descrição disponível.';
  const experienceYears = Number(caregiver?.experienceYears) || 0;
  const hourlyRate = Number(caregiver?.hourlyRate) || 0;
  const certificationsCount = Array.isArray(caregiver?.certifications)
    ? caregiver.certifications.length
    : 0;

  const caregiverId = caregiver._id || caregiver.id;

  const handleFavoriteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(caregiverId);
  };

  return (
    <Link href={`/cuidadores/${caregiverId}`}>
      <div className="card-hover p-6 h-full flex flex-col relative">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <UserAvatar
            name={user?.name}
            avatar={user?.avatar}
            size={64}
            className="rounded-2xl flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 truncate">
              {user?.name || 'Nome não informado'}
            </h3>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {caregiver.city || caregiver.state ? (
                `${caregiver.city || ''}, ${caregiver.state || ''}`
              ) : (
                'Localização não informada'
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={rating} size={14} />
              <span className="text-sm font-medium text-gray-700">
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">
                ({reviewCount} avaliações)
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
          {bio}
        </p>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(caregiver.specialties || []).slice(0, 3).map((spec: string) => (
            <span
              key={spec}
              className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg font-medium"
            >
              {SPECIALTIES[spec] || spec}
            </span>
          ))}
          {(caregiver.specialties?.length || 0) > 3 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">
              +{(caregiver.specialties.length || 0) - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              {experienceYears} anos
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Award className="w-3.5 h-3.5" />
              {certificationsCount} cert.
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-primary-600 font-bold">
              R$ {hourlyRate}/h
            </div>

            <button
              onClick={handleFavoriteClick}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  isFavorited
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              />
            </button>

            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}