'use client';

import Link from 'next/link';
import { Caregiver, SPECIALTIES, DAYS } from '@/types';
import { StarRating } from './StarRating';
import { UserAvatar } from './UserAvatar';
import {
  MapPin,
  Clock,
  Award,
  DollarSign,
  ChevronRight,
} from 'lucide-react';

interface Props {
  caregiver: Caregiver;
}

export function CaregiverCard({ caregiver }: Props) {
  const user = caregiver.userId;

  return (
    <Link href={`/cuidadores/${caregiver._id}`}>
      <div className="card-hover p-6 h-full flex flex-col">
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
              {user?.name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {caregiver.city}, {caregiver.state}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={caregiver.rating} size={14} />
              <span className="text-sm font-medium text-gray-700">
                {caregiver.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">
                ({caregiver.reviewCount} avaliações)
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
          {caregiver.bio}
        </p>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {caregiver.specialties.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg font-medium"
            >
              {SPECIALTIES[spec] || spec}
            </span>
          ))}
          {caregiver.specialties.length > 3 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">
              +{caregiver.specialties.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              {caregiver.experienceYears} anos
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Award className="w-3.5 h-3.5" />
              {caregiver.certifications?.length || 0} cert.
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary-600 font-bold">
            R$ {caregiver.hourlyRate}/h
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}