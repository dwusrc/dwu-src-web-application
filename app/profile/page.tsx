'use client';

import { useState, useEffect, useRef } from 'react';
import { PageLayout } from '@/app/components/layout/page-layout';
import { AuthenticatedRoute } from '@/app/components/auth/protected-route';
import { useSession } from '@/app/contexts/session-context';
import { supabase } from '@/lib/supabaseClient';

// Define the structure for the form state
interface ProfileFormState {
  full_name: string;
  phone: string;
}

// The main content of the profile page
function ProfilePageContent() {
  const { profile, user, loading } = useSession();
  const [formState, setFormState] = useState<ProfileFormState>({
    full_name: '',
    phone: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Populate form when profile data loads
  useEffect(() => {
    if (profile && mountedRef.current) {
      setFormState({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!mountedRef.current) return;
      
      if (profile?.avatar_url) {
        const path = profile.avatar_url;
        if (path) {
          try {
            const { data, error } = await supabase.storage
              .from('avatars')
              .createSignedUrl(path, 60 * 60 * 24 * 7);
            
            if (error) {
              setAvatarSrc(null);
              return;
            }
            
            if (mountedRef.current) {
              if (data?.signedUrl) {
                setAvatarSrc(data.signedUrl);
              } else {
                setAvatarSrc(null);
              }
            }
          } catch (error) {
            if (mountedRef.current) {
              setAvatarSrc(null);
            }
          }
        } else {
          if (mountedRef.current) {
            setAvatarSrc(null);
          }
        }
      } else {
        if (mountedRef.current) {
          setAvatarSrc(null);
        }
      }
    };
    getSignedUrl();
  }, [profile?.avatar_url]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1. Get a signed URL for the upload
      const response = await fetch('/api/avatar/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: file.type }),
      });
      
      const uploadData = await response.json();

      if (!response.ok || !uploadData.signedUrl) {
        throw new Error(uploadData.error || 'Failed to get a signed URL.');
      }

      // 2. Upload the file to Supabase Storage
      const uploadResponse = await fetch(uploadData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload avatar.');
      }

      // 3. Update the user's profile with the new avatar storage path
      const profileUpdateResponse = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formState, avatar_url: uploadData.path }),
      });
      
      const result = await profileUpdateResponse.json();
      if (!profileUpdateResponse.ok) throw new Error(result.error || 'Failed to update avatar URL.');

      window.location.reload();

    } catch (error: unknown) {
      alert('Error updating avatar');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !profile || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#359d49]"></div>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-[#2a6b39] mb-8">Your Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Avatar */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="relative w-40 h-40 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarSrc || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.full_name}`}
                alt="Avatar"
                className="rounded-full w-full h-full object-cover border-4 border-[#359d49]"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/8.x/initials/svg?seed=${profile.full_name}`;
                }}
              />
              <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-100 border">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a6b39" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarUpload}
                  disabled={isSubmitting}
                />
              </label>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{profile.full_name}</h2>
            <p className="text-gray-500 capitalize">{profile.role}</p>
          </div>

          {/* Right Column: Profile Form */}
          <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
            <div>
              <div className="space-y-6">
                {/* Read-only fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <p className="mt-1 text-lg text-gray-500 bg-gray-100 p-2 rounded-md">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student ID</label>
                  <p className="mt-1 text-lg text-gray-500 bg-gray-100 p-2 rounded-md">{profile.student_id || 'N/A'}</p>
                </div>

                {/* Editable fields */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#359d49] focus:border-[#359d49]"
                    value={formState.full_name}
                    onChange={handleInputChange}
                    onFocus={() => setIsEditing(true)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#359d49] focus:border-[#359d49]"
                    value={formState.phone}
                    onChange={handleInputChange}
                    onFocus={() => setIsEditing(true)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              {isEditing && (
                 <div className="mt-8 text-right">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSubmitting(true);
                      
                      try {
                        const response = await fetch('/api/profile/update', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(formState),
                        });

                        const result = await response.json();

                        if (response.ok) {
                          window.location.reload();
                        } else {
                          alert('Error: ' + result.error);
                        }
                      } catch (error) {
                        alert('Error updating profile');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting}
                    className={`font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#359d49] transition-colors ${
                      isSubmitting 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : 'bg-[#359d49] text-white hover:bg-[#2a6b39]'
                    }`}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// The final export wraps the content with the authentication check
export default function ProfilePage() {
  return (
    <AuthenticatedRoute>
      <ProfilePageContent />
    </AuthenticatedRoute>
  );
} 