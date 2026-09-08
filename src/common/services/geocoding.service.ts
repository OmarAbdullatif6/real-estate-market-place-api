import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';

interface NominatimResponse {
  address?: {
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    city_district?: string;
    suburb?: string;
  };
}

@Injectable()
export class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/reverse';

  async getCityFromCoordinates(
    latitude: number,
    longitude: number,
  ): Promise<string> {
    try {
      const response = await axios.get<NominatimResponse>(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'jsonv2',
            addressdetails: 1,
            'accept-language': 'en',
          },
          headers: {
            'User-Agent': 'RealEstateApp/1.0',
          },
        },
      );

      console.log('Nominatim response:', response.data);
      const address = response.data.address;

      if (!address) {
        throw new BadRequestException(
          'Could not determine the address from the provided coordinates',
        );
      }

      const city =
        address.city_district ??
        address.city ??
        address.town ??
        address.municipality ??
        address.village ??
        address.suburb;

      if (!city) {
        throw new BadRequestException(
          'Could not determine the city from the provided coordinates',
        );
      }

      return city;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new ServiceUnavailableException('Geocoding service is unavailable');
    }
  }
}
